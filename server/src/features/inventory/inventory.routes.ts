import { Router, Request, Response } from 'express';
import multer from 'multer';
import * as XLSX from 'xlsx';
import { authenticate, authorize } from '@/shared/middleware';
import { asyncHandler } from '@/shared/utils';
import { InventoryData } from './inventoryData.model';

const router = Router();

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
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

router.use(authenticate);

type UploadMode = 'replace' | 'append';
type DuplicateAction = 'add' | 'skip';

const parseUploadMode = (value: unknown): UploadMode => (value === 'append' ? 'append' : 'replace');

/**
 * GET /api/inventory - Get inventory data
 * Access: All authenticated users
 */
router.get(
  '/',
  asyncHandler(async (_req: Request, res: Response) => {
    const inventoryData = await InventoryData.findOne({}).sort({ uploadedAt: -1 }).lean();

    if (!inventoryData) {
      res.json({
        success: true,
        items: [],
        totalItems: 0,
        message: 'No inventory data found',
      });
      return;
    }

    res.json({
      success: true,
      items: inventoryData.items,
      totalItems: inventoryData.totalItems,
      uploadedAt: inventoryData.uploadedAt,
      uploadedBy: inventoryData.uploadedBy,
    });
  })
);

/**
 * POST /api/inventory/upload - Upload inventory Excel file
 * Access: Logistics, Manager, Admin, Accountant
 */
router.post(
  '/upload',
  authorize(['logistics', 'manager', 'admin', 'accountant']),
  (req: Request, res: Response, next) => {
    upload.single('file')(req, res, (err) => {
      if (err) {
        console.error('Multer error:', err);
        return res.status(400).json({
          success: false,
          message: err.message || 'File upload error',
        });
      }
      next();
    });
  },
  asyncHandler(async (req: Request, res: Response) => {
    if (!req.file) {
      res.status(400).json({
        success: false,
        message: 'No file uploaded',
      });
      return;
    }

    const mode = parseUploadMode(req.body?.mode);
    let duplicateActions: Record<string, DuplicateAction> | null = null;
    if (typeof req.body?.duplicateActions === 'string' && req.body.duplicateActions.length > 0) {
      try {
        duplicateActions = JSON.parse(req.body.duplicateActions) as Record<string, DuplicateAction>;
      } catch {
        duplicateActions = null;
      }
    }

    const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const rawData: unknown[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 });

    if (rawData.length < 2) {
      res.status(400).json({
        success: false,
        message: 'File is empty or has no data rows',
      });
      return;
    }

    // Process rows (skip header)
    const items = rawData
      .slice(1)
      .map((row: unknown[]) => ({
        itemCode: String(row[0] || '').trim(),
        itemDescription: String(row[1] || '').trim(),
        quantity: Number(row[2]) || 0,
        color: String(row[3] || '').trim(),
        pricePerCarton: Number(row[4]) || 0,
        soldQuantity: 0,
        soldAt: null,
      }))
      .filter((item) => item.itemCode && item.quantity > 0);

    if (items.length === 0) {
      res.status(400).json({
        success: false,
        message: 'No valid items found in file',
      });
      return;
    }

    const uploadedBy =
      (req as Request & { user?: { name?: string; username?: string } }).user?.name ||
      (req as Request & { user?: { name?: string; username?: string } }).user?.username ||
      '';

    if (mode === 'append') {
      const existingData = await InventoryData.findOne({}).sort({ uploadedAt: -1 }).lean();
      const existingItems = existingData?.items || [];
      const existingMap = new Map(existingItems.map((item) => [item.itemCode, item]));
      const duplicates = items
        .filter((item) => existingMap.has(item.itemCode))
        .map((item) => ({
          itemCode: item.itemCode,
          itemDescription: item.itemDescription,
          newQuantity: item.quantity,
          existingQuantity: existingMap.get(item.itemCode)?.quantity || 0,
        }));

      if (duplicates.length > 0 && !duplicateActions) {
        res.status(409).json({
          success: false,
          code: 'DUPLICATES',
          message: 'Some items already exist in inventory',
          duplicates,
        });
        return;
      }

      const mergedMap = new Map(existingItems.map((item) => [item.itemCode, { ...item }]));

      for (const item of items) {
        const existing = mergedMap.get(item.itemCode);
        if (!existing) {
          mergedMap.set(item.itemCode, { ...item });
          continue;
        }

        const action = duplicateActions?.[item.itemCode] || 'skip';
        if (action === 'add') {
          mergedMap.set(item.itemCode, {
            ...existing,
            itemDescription: item.itemDescription || existing.itemDescription,
            color: item.color || existing.color,
            pricePerCarton: item.pricePerCarton || existing.pricePerCarton,
            quantity: existing.quantity + item.quantity,
          });
        }
      }

      const mergedItems = Array.from(mergedMap.values());
      await InventoryData.deleteMany({});
      await InventoryData.create({
        items: mergedItems,
        totalItems: mergedItems.length,
        uploadedAt: new Date(),
        uploadedBy,
      });

      res.json({
        success: true,
        message: `מלאי בארץ עודכן בהצלחה - ${mergedItems.length} פריטים`,
        totalItems: mergedItems.length,
      });
      return;
    }

    // Replace mode: clear existing and insert new
    await InventoryData.deleteMany({});
    await InventoryData.create({
      items,
      totalItems: items.length,
      uploadedAt: new Date(),
      uploadedBy,
    });

    res.json({
      success: true,
      message: `מלאי בארץ עודכן בהצלחה - ${items.length} פריטים`,
      totalItems: items.length,
    });
  })
);

/**
 * PATCH /api/inventory/sold - Mark item sold quantity
 * Access: Logistics, Manager, Admin, Accountant
 */
router.patch(
  '/sold',
  authorize(['logistics', 'manager', 'admin', 'accountant']),
  asyncHandler(async (req: Request, res: Response) => {
    const { itemCode, soldQuantity } = req.body as { itemCode?: string; soldQuantity?: number };
    const normalizedCode = typeof itemCode === 'string' ? itemCode.trim() : '';
    const quantityToSell = Number(soldQuantity) || 0;

    if (!normalizedCode || quantityToSell <= 0) {
      res.status(400).json({
        success: false,
        message: 'Invalid item code or sold quantity',
      });
      return;
    }

    const inventoryData = await InventoryData.findOne({}).sort({ uploadedAt: -1 });
    if (!inventoryData) {
      res.status(404).json({
        success: false,
        message: 'No inventory data found',
      });
      return;
    }

    const item = inventoryData.items.find((entry) => entry.itemCode === normalizedCode);
    if (!item) {
      res.status(404).json({
        success: false,
        message: 'Item not found',
      });
      return;
    }

    const currentSold = item.soldQuantity || 0;
    const nextSold = Math.min(item.quantity, currentSold + quantityToSell);
    item.soldQuantity = nextSold;
    if (nextSold >= item.quantity) {
      item.soldAt = new Date();
    }

    await inventoryData.save();

    res.json({
      success: true,
      itemCode: item.itemCode,
      soldQuantity: item.soldQuantity,
      soldAt: item.soldAt,
    });
  })
);

export default router;
