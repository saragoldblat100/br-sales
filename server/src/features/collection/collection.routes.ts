import { Router, Request, Response } from 'express';
import multer, { FileFilterCallback } from 'multer';
import * as XLSX from 'xlsx';
import { authenticate, authorize, AuthenticatedRequest } from '@/shared/middleware';
import { asyncHandler } from '@/shared/utils';
import { CollectionRecord } from './collectionRecord.model';
import { CollectionData } from './collectionData.model';
import { activityService } from '@/features/activity';

// Extend Express Request to include file from multer
interface MulterRequest extends Request {
  file?: Express.Multer.File;
}

const router = Router();

// Configure multer for file upload
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (_req: Request, file: Express.Multer.File, cb: FileFilterCallback) => {
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

// Helper function to parse number from Excel (handles currency symbols, commas, etc.)
function parseNumber(value: unknown): number {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    return Number(value.replace(/[^\d.-]/g, '')) || 0;
  }
  return 0;
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
    // Disable caching to ensure fresh data after updates
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');

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
    // Only fully collected cases should be filtered out from the collection list
    const fullyCastedCaseKeys = new Set(
      collectedRecords
        .filter((r) => !r.isPartial)
        .map((r) => `${r.customerName}|${r.caseNumber}`)
    );

    // Build a map of partial records for easy lookup in UI
    const partialRecordsMap = new Map<string, { collectedAmount: number; notes: string }>();
    collectedRecords
      .filter((r) => r.isPartial)
      .forEach((r) => {
        partialRecordsMap.set(`${r.customerName}|${r.caseNumber}`, {
          collectedAmount: r.collectedAmount,
          notes: r.notes || '',
        });
      });

    // Filter out fully collected cases and add urgency
    const customers = collectionData
      .map((customer) => {
        const uncollectedCases = customer.cases
          .filter((c) => !fullyCastedCaseKeys.has(`${customer.customerName}|${c.caseNumber}`))
          .map((c) => {
            const partialRecord = partialRecordsMap.get(`${customer.customerName}|${c.caseNumber}`) || null;
            return { ...c, partialRecord };
          });

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
  upload.single('file'),
  asyncHandler(async (req: Request, res: Response) => {
    const multerReq = req as MulterRequest;
    if (!multerReq.file) {
      res.status(400).json({
        success: false,
        message: 'No file uploaded',
      });
      return;
    }

    // Read the uploaded Excel file from buffer
    const workbook = XLSX.read(multerReq.file.buffer, { type: 'buffer' });
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
          quantity: parseNumber(row[6]),
          currency: String(row[7] || 'ILS'),
          pricePerUnit: parseNumber(row[8]),
          rowTotal: parseNumber(row[9]),
          totalWithVAT: parseNumber(row[10]),
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
        // Column K contains the total for the entire case - take it once when creating the case
        customer.cases.set(caseNumber, {
          caseNumber,
          orderNumber: row.orderNumber,
          deliveryNoteNumber: row.deliveryNoteNumber,
          expectedArrivalDate: row.expectedArrivalDate,
          items: [],
          caseTotal: row.totalWithVAT || 0,
          caseTotalWithVAT: row.totalWithVAT || 0,
        });

        // Add to customer total only once per case
        customer.totalWithVAT += row.totalWithVAT || 0;
        customer.totalAmount += row.totalWithVAT || 0;
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
 * Access: Sales agents, managers, accountants, admin
 */
router.post(
  '/mark-collected',
  authorize(['sales_agent', 'manager', 'accountant', 'admin']),
  asyncHandler(async (req: Request, res: Response) => {
    const { caseNumber, customerName, collectedAmount, collectedBy, note } = req.body;

    // Validation: Required fields
    if (!caseNumber || !customerName) {
      res.status(400).json({
        success: false,
        message: 'חסרים פרטי תיק או לקוח',
      });
      return;
    }

    // Validation: collectedAmount must be a positive number
    const parsedAmount = Number(collectedAmount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      res.status(400).json({
        success: false,
        message: 'סכום הגבייה חייב להיות מספר חיובי',
      });
      return;
    }

    // Validation: Limit note length to 1000 characters
    const trimmedNote = note ? String(note).trim().substring(0, 1000) : '';

    // Get the case from collection data to determine if it's partial payment
    const collectionData = await CollectionData.findOne({ customerName });
    if (!collectionData) {
      res.status(404).json({
        success: false,
        message: 'לקוח לא נמצא במערכת',
      });
      return;
    }

    const caseData = collectionData.cases.find((c) => c.caseNumber === caseNumber);
    if (!caseData) {
      res.status(404).json({
        success: false,
        message: 'תיק לא נמצא עבור לקוח זה',
      });
      return;
    }

    const caseTotal = caseData.caseTotalWithVAT || 0;
    const isPartialPayment = parsedAmount < caseTotal;

    const record = await CollectionRecord.findOneAndUpdate(
      { caseNumber, customerName },
      {
        caseNumber,
        customerName,
        collectedAmount: parsedAmount,
        collectedBy: collectedBy || '',
        collectedAt: new Date(),
        notes: trimmedNote,
        isPartial: isPartialPayment,
      },
      { upsert: true, new: true }
    );

    // Log activity
    const authReq = req as AuthenticatedRequest;
    if (authReq.user) {
      activityService.log(authReq.user.id, authReq.user.username, 'collection_mark', {
        caseNumber,
        customerName,
        collectedAmount: parsedAmount,
        isPartial: isPartialPayment,
        note: trimmedNote,
      });
    }

    res.json({
      success: true,
      message: isPartialPayment ? 'גבייה חלקית נשמרה בהצלחה' : 'התיק סומן כנגבה',
      record,
    });
  })
);

/**
 * POST /api/collection/unmark-collected - Unmark a case
 * Access: Managers, accountants, admin only
 */
router.post(
  '/unmark-collected',
  authorize(['manager', 'accountant', 'admin']),
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
 * POST /api/collection/delete-collected - Delete a collected case permanently
 * Access: Admin only
 */
router.post(
  '/delete-collected',
  authorize(['admin']),
  asyncHandler(async (req: Request, res: Response) => {
    const { caseNumber, customerName } = req.body;

    if (!caseNumber || !customerName) {
      res.status(400).json({
        success: false,
        message: 'חסרים פרטי תיק או לקוח',
      });
      return;
    }

    const deleted = await CollectionRecord.findOneAndDelete({ caseNumber, customerName });

    if (!deleted) {
      res.status(404).json({
        success: false,
        message: 'הגבייה לא נמצאה',
      });
      return;
    }

    // Log activity
    const authReq = req as AuthenticatedRequest;
    if (authReq.user) {
      activityService.log(authReq.user.id, authReq.user.username, 'collection_delete', {
        caseNumber,
        customerName,
      });
    }

    res.json({
      success: true,
      message: 'הגבייה נמחקה בהצלחה',
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
    // Get all records (both partial and full)
    const allRecords = await CollectionRecord.find({}).lean();

    // Calculate totals including both partial and full collections
    const totalCollected = allRecords.reduce((sum, r) => sum + r.collectedAmount, 0);
    const totalCases = allRecords.length;

    // Group by date (for all records to show statistics)
    const byDate: Record<string, { count: number; amount: number }> = {};
    allRecords.forEach((r) => {
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
      records: allRecords,
      byDate,
    });
  })
);

export default router;






