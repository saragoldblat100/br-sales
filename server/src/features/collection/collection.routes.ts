import { Router, Request, Response } from 'express';
import multer from 'multer';
import * as XLSX from 'xlsx';
import { authenticate, authorize } from '@/shared/middleware';
import { asyncHandler } from '@/shared/utils';
import { CollectionRecord } from './collectionRecord.model';
import { CollectionData } from './collectionData.model';

const router = Router();

// Configure multer for file upload
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (_req, file, cb) => {
    const allowedTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
    ];
    if (
      allowedTypes.includes(file.mimetype) ||
      file.originalname.endsWith('.xlsx') ||
      file.originalname.endsWith('.xls')
    ) {
      cb(null, true);
    } else {
      cb(new Error('Only Excel files are allowed'));
    }
  },
});

// All routes require authentication
router.use(authenticate);

// Customers to exclude from the collection report
const EXCLUDED_CUSTOMERS = ['השלושה', 'שופרסל'];

// Helper function to check if customer should be excluded
function isExcludedCustomer(customerName: string): boolean {
  if (!customerName) return true;
  const normalizedName = customerName.trim();
  return EXCLUDED_CUSTOMERS.some(
    (excluded) => normalizedName.includes(excluded) || excluded.includes(normalizedName)
  );
}

// Helper function to convert Excel serial date to JS Date
function excelDateToJSDate(serial: number): Date | null {
  if (!serial || typeof serial !== 'number') return null;
  const utc_days = Math.floor(serial - 25569);
  const utc_value = utc_days * 86400;
  return new Date(utc_value * 1000);
}

// Helper function to calculate urgency level based on expected arrival date
function calculateUrgency(expectedDate: Date | null): {
  level: string;
  color: string;
  daysLeft: number | null;
} {
  if (!expectedDate) return { level: 'unknown', color: 'gray', daysLeft: null };

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const expected = new Date(expectedDate);
  expected.setHours(0, 0, 0, 0);

  const diffTime = expected.getTime() - today.getTime();
  const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (daysLeft < 5) {
    return { level: 'urgent', color: 'red', daysLeft };
  } else if (daysLeft <= 8) {
    return { level: 'warning', color: 'orange', daysLeft };
  } else {
    return { level: 'normal', color: 'green', daysLeft };
  }
}

/**
 * GET /api/collection - Get all collection data
 * Access: All authenticated users
 */
router.get(
  '/',
  asyncHandler(async (_req: Request, res: Response) => {
    // Get all collection data from database
    const collectionData = await CollectionData.find({}).lean();

    if (collectionData.length === 0) {
      res.json({
        success: true,
        customers: [],
        totalCustomers: 0,
        totalAmount: 0,
        totalWithVAT: 0,
        message: 'No collection data found',
      });
      return;
    }

    // Get all collected cases from database
    const collectedRecords = await CollectionRecord.find({}).lean();
    const collectedCaseKeys = new Set(
      collectedRecords.map((r) => `${r.customerName}|${r.caseNumber}`)
    );

    // Filter out collected cases and add urgency
    const customers = collectionData
      .map((customer) => {
        const uncollectedCases = customer.cases.filter(
          (c) => !collectedCaseKeys.has(`${customer.customerName}|${c.caseNumber}`)
        );

        // Recalculate totals for uncollected cases only
        const totalAmount = uncollectedCases.reduce((sum, c) => sum + c.caseTotal, 0);
        const totalWithVAT = uncollectedCases.reduce((sum, c) => sum + c.caseTotalWithVAT, 0);

        // Find earliest date among uncollected cases
        let earliestDate: Date | null = null;
        uncollectedCases.forEach((c) => {
          if (c.expectedArrivalDate) {
            if (!earliestDate || new Date(c.expectedArrivalDate) < earliestDate) {
              earliestDate = new Date(c.expectedArrivalDate);
            }
          }
        });

        return {
          customerName: customer.customerName,
          cases: uncollectedCases,
          totalCases: uncollectedCases.length,
          totalItems: uncollectedCases.reduce((sum, c) => sum + c.items.length, 0),
          totalAmount,
          totalWithVAT,
          earliestDate,
          urgency: calculateUrgency(earliestDate),
        };
      })
      .filter((customer) => customer.cases.length > 0);

    // Sort by urgency (most urgent first)
    customers.sort((a, b) => {
      const urgencyOrder: Record<string, number> = { red: 0, orange: 1, green: 2, gray: 3 };
      return (urgencyOrder[a.urgency.color] || 3) - (urgencyOrder[b.urgency.color] || 3);
    });

    // Calculate totals
    const totalAmount = customers.reduce((sum, c) => sum + c.totalAmount, 0);
    const totalWithVAT = customers.reduce((sum, c) => sum + c.totalWithVAT, 0);
    const totalCollected = collectedRecords.reduce((sum, r) => sum + r.collectedAmount, 0);

    res.json({
      success: true,
      customers,
      totalCustomers: customers.length,
      totalAmount,
      totalWithVAT,
      totalCollected,
      totalCollectedCases: collectedRecords.length,
    });
  })
);

/**
 * POST /api/collection/upload - Upload Excel file
 * Access: Manager and Accountant only
 */
router.post(
  '/upload',
  authorize(['manager', 'accountant', 'admin']),
  (req: Request, res: Response, next) => {
    console.log('Upload route reached, processing file...');
    console.log('Content-Type:', req.headers['content-type']);
    upload.single('file')(req, res, (err) => {
      if (err) {
        console.error('Multer error:', err);
        return res.status(400).json({
          success: false,
          message: err.message || 'File upload error',
        });
      }
      console.log('File processed:', req.file ? req.file.originalname : 'NO FILE');
      next();
    });
  },
  asyncHandler(async (req: Request, res: Response) => {
    if (!req.file) {
      console.log('No file in request after multer');
      res.status(400).json({
        success: false,
        message: 'No file uploaded',
      });
      return;
    }

    // Read the uploaded Excel file from buffer
    const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const rawData: unknown[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 });

    // Validate the file structure
    if (rawData.length < 2) {
      res.status(400).json({
        success: false,
        message: 'File is empty or has no data rows',
      });
      return;
    }

    // Process rows
    interface RowData {
      orderNumber: string;
      deliveryNoteNumber: string;
      caseNumber: string;
      expectedArrivalDate: Date | null;
      itemCode: string;
      itemDescription: string;
      quantity: number;
      currency: string;
      pricePerUnit: number;
      rowTotal: number;
      totalWithVAT: number;
      customerName: string;
    }

    const rows: RowData[] = rawData
      .slice(1)
      .map((row: unknown[]) => {
        const expectedDateRaw = row[3] as number;
        const expectedDate = excelDateToJSDate(expectedDateRaw);

        return {
          orderNumber: String(row[0] || ''),
          deliveryNoteNumber: String(row[1] || ''),
          caseNumber: String(row[2] || ''),
          expectedArrivalDate: expectedDate,
          itemCode: String(row[4] || ''),
          itemDescription: String(row[5] || ''),
          quantity: Number(row[6]) || 0,
          currency: String(row[7] || 'ILS'),
          pricePerUnit: Number(row[8]) || 0,
          rowTotal: Number(row[9]) || 0,
          totalWithVAT: Number(row[10]) || 0,
          customerName: String(row[11] || ''),
        };
      })
      .filter((row) => row.customerName && row.caseNumber && !isExcludedCustomer(row.customerName));

    if (rows.length === 0) {
      res.status(400).json({
        success: false,
        message: 'No valid rows found in file',
      });
      return;
    }

    // Group by customer
    const customerMap = new Map<
      string,
      {
        customerName: string;
        cases: Map<
          string,
          {
            caseNumber: string;
            orderNumber: string;
            deliveryNoteNumber: string;
            expectedArrivalDate: Date | null;
            items: {
              itemCode: string;
              itemDescription: string;
              quantity: number;
              currency: string;
              pricePerUnit: number;
              rowTotal: number;
              totalWithVAT: number;
            }[];
            caseTotal: number;
            caseTotalWithVAT: number;
          }
        >;
        totalAmount: number;
        totalWithVAT: number;
        earliestDate: Date | null;
      }
    >();

    rows.forEach((row) => {
      const customerName = row.customerName;

      if (!customerMap.has(customerName)) {
        customerMap.set(customerName, {
          customerName,
          cases: new Map(),
          totalAmount: 0,
          totalWithVAT: 0,
          earliestDate: null,
        });
      }

      const customer = customerMap.get(customerName)!;
      const caseNumber = row.caseNumber;

      if (!customer.cases.has(caseNumber)) {
        customer.cases.set(caseNumber, {
          caseNumber,
          orderNumber: row.orderNumber,
          deliveryNoteNumber: row.deliveryNoteNumber,
          expectedArrivalDate: row.expectedArrivalDate,
          items: [],
          caseTotal: 0,
          caseTotalWithVAT: 0,
        });
      }

      const caseData = customer.cases.get(caseNumber)!;
      caseData.items.push({
        itemCode: row.itemCode,
        itemDescription: row.itemDescription,
        quantity: row.quantity,
        currency: row.currency,
        pricePerUnit: row.pricePerUnit,
        rowTotal: row.rowTotal,
        totalWithVAT: row.totalWithVAT,
      });

      caseData.caseTotal += row.rowTotal || 0;
      caseData.caseTotalWithVAT += row.totalWithVAT || 0;
      customer.totalAmount += row.rowTotal || 0;
      customer.totalWithVAT += row.totalWithVAT || 0;

      if (row.expectedArrivalDate) {
        if (!customer.earliestDate || row.expectedArrivalDate < customer.earliestDate) {
          customer.earliestDate = row.expectedArrivalDate;
        }
      }
    });

    const uploadedBy = (req as Request & { user?: { name?: string; username?: string } }).user?.name ||
                       (req as Request & { user?: { name?: string; username?: string } }).user?.username || '';

    // Get upload mode from request body
    const mode = req.body.mode || 'replace';

    if (mode === 'replace') {
      // Clear existing data and insert new
      await CollectionData.deleteMany({});

      const customersToInsert = Array.from(customerMap.values()).map((customer) => ({
        customerName: customer.customerName,
        cases: Array.from(customer.cases.values()),
        totalAmount: customer.totalAmount,
        totalWithVAT: customer.totalWithVAT,
        earliestDate: customer.earliestDate,
        uploadedAt: new Date(),
        uploadedBy,
      }));

      await CollectionData.insertMany(customersToInsert);

      res.json({
        success: true,
        message: `קובץ גבייה עודכן בהצלחה עם ${rows.length} שורות`,
        totalRows: rows.length,
        totalCustomers: customersToInsert.length,
      });
    } else {
      // Append mode - only add new cases that don't exist
      let addedCount = 0;
      let skippedCount = 0;

      for (const [customerName, customerData] of customerMap) {
        // Find or create customer document
        let existingCustomer = await CollectionData.findOne({ customerName });

        if (!existingCustomer) {
          // Customer doesn't exist - create new
          const newCustomer = {
            customerName: customerData.customerName,
            cases: Array.from(customerData.cases.values()),
            totalAmount: customerData.totalAmount,
            totalWithVAT: customerData.totalWithVAT,
            earliestDate: customerData.earliestDate,
            uploadedAt: new Date(),
            uploadedBy,
          };
          await CollectionData.create(newCustomer);
          addedCount += customerData.cases.size;
        } else {
          // Customer exists - check each case
          const existingCaseNumbers = new Set(existingCustomer.cases.map(c => c.caseNumber));

          for (const [caseNumber, caseData] of customerData.cases) {
            if (existingCaseNumbers.has(caseNumber)) {
              // Case already exists - skip
              skippedCount++;
            } else {
              // Case is new - add it
              existingCustomer.cases.push(caseData);
              existingCustomer.totalAmount += caseData.caseTotal;
              existingCustomer.totalWithVAT += caseData.caseTotalWithVAT;

              // Update earliest date if needed
              if (caseData.expectedArrivalDate) {
                if (!existingCustomer.earliestDate ||
                    new Date(caseData.expectedArrivalDate) < new Date(existingCustomer.earliestDate)) {
                  existingCustomer.earliestDate = caseData.expectedArrivalDate;
                }
              }
              addedCount++;
            }
          }

          await existingCustomer.save();
        }
      }

      res.json({
        success: true,
        message: `נוספו ${addedCount} תיקים חדשים, ${skippedCount} דולגו (כבר קיימים)`,
        addedCount,
        skippedCount,
        totalRows: rows.length,
      });
    }
  })
);

/**
 * POST /api/collection/mark-collected - Mark a case as collected
 * Access: All authenticated users
 */
router.post(
  '/mark-collected',
  asyncHandler(async (req: Request, res: Response) => {
    const { caseNumber, customerName, collectedAmount, collectedBy } = req.body;

    if (!caseNumber || !customerName) {
      res.status(400).json({
        success: false,
        message: 'חסרים פרטי תיק או לקוח',
      });
      return;
    }

    const record = await CollectionRecord.findOneAndUpdate(
      { caseNumber, customerName },
      {
        caseNumber,
        customerName,
        collectedAmount: collectedAmount || 0,
        collectedBy: collectedBy || '',
        collectedAt: new Date(),
      },
      { upsert: true, new: true }
    );

    res.json({
      success: true,
      message: 'התיק סומן כנגבה',
      record,
    });
  })
);

/**
 * POST /api/collection/unmark-collected - Unmark a case
 * Access: All authenticated users
 */
router.post(
  '/unmark-collected',
  asyncHandler(async (req: Request, res: Response) => {
    const { caseNumber, customerName } = req.body;

    if (!caseNumber || !customerName) {
      res.status(400).json({
        success: false,
        message: 'חסרים פרטי תיק או לקוח',
      });
      return;
    }

    await CollectionRecord.findOneAndDelete({ caseNumber, customerName });

    res.json({
      success: true,
      message: 'הסימון הוסר',
    });
  })
);

/**
 * GET /api/collection/stats - Get collection statistics
 * Access: Manager and Accountant only
 */
router.get(
  '/stats',
  authorize(['manager', 'accountant', 'admin']),
  asyncHandler(async (_req: Request, res: Response) => {
    const records = await CollectionRecord.find({}).lean();

    const totalCollected = records.reduce((sum, r) => sum + r.collectedAmount, 0);
    const totalCases = records.length;

    // Group by date
    const byDate: Record<string, { count: number; amount: number }> = {};
    records.forEach((r) => {
      const date = new Date(r.collectedAt).toLocaleDateString('he-IL');
      if (!byDate[date]) {
        byDate[date] = { count: 0, amount: 0 };
      }
      byDate[date].count++;
      byDate[date].amount += r.collectedAmount;
    });

    res.json({
      success: true,
      totalCollected,
      totalCases,
      records,
      byDate,
    });
  })
);

export default router;
