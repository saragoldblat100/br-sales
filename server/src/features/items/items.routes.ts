import { Router, Request, Response } from 'express';
import { authenticate } from '@/shared/middleware';
import { asyncHandler } from '@/shared/utils';
import { Item } from './item.model';
import { Category } from './category.model';
import { SpecialPrice } from './specialPrice.model';
import { FreightRate } from './freightRate.model';
import { MarginRule } from './marginRule.model';
import { getCurrentRate } from '@/features/currency';

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * Helper function to add special price info to items
 */
async function addSpecialPricesToItems(items: any[], customerCode?: string) {
  if (!customerCode) return items;

  const itemCodes = items.map((item) => item.itemCode);
  const specialPrices = await SpecialPrice.find({
    customerCode,
    itemCode: { $in: itemCodes },
  });

  const priceMap = new Map(specialPrices.map((sp) => [sp.itemCode, sp]));

  return items.map((item) => {
    const sp = priceMap.get(item.itemCode);
    return {
      ...item.toObject ? item.toObject() : item,
      hasSpecialPrice: !!sp,
      specialPrice: sp ? { price: sp.specialPrice, currency: sp.currency } : null,
    };
  });
}

/**
 * GET /api/sales/categories - Get all active categories
 */
router.get(
  '/categories',
  asyncHandler(async (_req: Request, res: Response) => {
    const categories = await Category.find({ isActive: true })
      .select('name nameEn nameHe icon order')
      .sort({ order: 1, name: 1 });

    res.json({ categories });
  })
);

/**
 * GET /api/sales/items/search - Search items by code or name
 */
router.get(
  '/items/search',
  asyncHandler(async (req: Request, res: Response) => {
    const { q, customerCode } = req.query;

    if (!q || (q as string).length < 2) {
      res.json({ items: [] });
      return;
    }

    const items = await Item.find({
      isActive: true,
      $or: [
        { itemCode: { $regex: q, $options: 'i' } },
        { nameHe: { $regex: q, $options: 'i' } },
        { englishDescription: { $regex: q, $options: 'i' } },
      ],
    })
      .populate('categoryId', 'name nameEn nameHe')
      .limit(20)
      .sort({ itemCode: 1 });

    const itemsWithPrices = await addSpecialPricesToItems(items, customerCode as string);
    res.json({ items: itemsWithPrices });
  })
);

/**
 * GET /api/sales/items/category/:categoryId - Get items by category
 */
router.get(
  '/items/category/:categoryId',
  asyncHandler(async (req: Request, res: Response) => {
    const { categoryId } = req.params;
    const { customerCode } = req.query;

    const items = await Item.find({
      categoryId,
      isActive: true,
    })
      .populate('categoryId', 'name nameEn nameHe')
      .sort({ itemCode: 1 });

    const itemsWithPrices = await addSpecialPricesToItems(items, customerCode as string);
    res.json({ items: itemsWithPrices });
  })
);

/**
 * GET /api/sales/items/recent - Get recently sold items
 */
router.get(
  '/items/recent',
  asyncHandler(async (req: Request, res: Response) => {
    const { customerCode } = req.query;

    // Calculate date 12 months ago
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

    const items = await Item.find({
      isActive: true,
      lastSalesOrderDate: { $gte: twelveMonthsAgo },
    })
      .populate('categoryId', 'name nameEn nameHe')
      .sort({ lastSalesOrderDate: -1 })
      .limit(100);

    const itemsWithPrices = await addSpecialPricesToItems(items, customerCode as string);
    res.json({ items: itemsWithPrices });
  })
);

/**
 * GET /api/sales/items/with-images - Get items with images
 */
router.get(
  '/items/with-images',
  asyncHandler(async (req: Request, res: Response) => {
    const { customerCode, categoryId } = req.query;

    const query: any = {
      isActive: true,
      imageUrl: { $exists: true, $nin: [null, '', undefined] },
    };

    if (categoryId) {
      query.categoryId = categoryId;
    }

    const items = await Item.find(query)
      .populate('categoryId', 'name nameEn nameHe')
      .sort({ itemCode: 1 })
      .limit(500);

    const itemsWithPrices = await addSpecialPricesToItems(items, customerCode as string);
    res.json({ items: itemsWithPrices });
  })
);

/**
 * GET /api/sales/items/special/:customerCode - Get items with special prices for customer
 */
router.get(
  '/items/special/:customerCode',
  asyncHandler(async (req: Request, res: Response) => {
    const { customerCode } = req.params;

    // Find all special prices for this customer
    const specialPrices = await SpecialPrice.find({ customerCode });

    if (specialPrices.length === 0) {
      res.json({ items: [] });
      return;
    }

    // Get all item codes with special prices
    const itemCodes = specialPrices.map(sp => sp.itemCode);

    // Find the items
    const items = await Item.find({
      itemCode: { $in: itemCodes },
      isActive: true,
    }).populate('categoryId', 'name nameEn nameHe');

    // Add special price info
    const itemsWithPrices = await addSpecialPricesToItems(items, customerCode);
    res.json({ items: itemsWithPrices });
  })
);

/**
 * POST /api/sales/items/:itemId/calculate-price - Calculate item price
 * Full implementation based on supplier-price-form priceCalculator.js
 */
router.post(
  '/items/:itemId/calculate-price',
  asyncHandler(async (req: Request, res: Response) => {
    const { itemId } = req.params;
    const { customerCode, quantity, portOfOrigin = 'Shenzhen Yantian', containerSizeCBM = 68 } = req.body;

    const item = await Item.findById(itemId).populate('categoryId');
    if (!item) {
      res.status(404).json({ error: 'Item not found' });
      return;
    }

    // Get current USD rate (with margin already applied)
    const usdRate = await getCurrentRate();

    // If no rate available, return error
    if (!usdRate) {
      res.status(400).json({
        error: true,
        message: 'אין שער דולר זמין במערכת',
        details: 'נדרש להכניס שער דולר ידנית או להמתין לעדכון מבנק ישראל'
      });
      return;
    }

    const usdToIls = usdRate;

    // Validate required item fields
    const missingFields: string[] = [];

    if (!item.supplierPrice || item.supplierPrice === 0) {
      missingFields.push('מחיר ספק');
    }

    if (!item.boxCBM || item.boxCBM === 0) {
      missingFields.push('נפח קרטון (CBM)');
    }

    if (!item.qtyPerCarton || item.qtyPerCarton === 0) {
      missingFields.push('כמות יחידות בקרטון');
    }

    if (!item.categoryId) {
      missingFields.push('קטגוריה');
    }

    const qtyPerCarton = item.qtyPerCarton || 1;
    const boxCBM = item.boxCBM || 0;
    const requestedQuantity = quantity || qtyPerCarton;
    const numberOfCartons = Math.ceil(requestedQuantity / qtyPerCarton);
    const totalCBM = numberOfCartons * boxCBM;

    // Check for special price - if exists, it's the FINAL price per carton (no additional margins!)
    if (customerCode) {
      const sp = await SpecialPrice.findOne({ customerCode, itemCode: item.itemCode });
      if (sp) {
        // Special price = final price per carton, no additions
        const currency = (sp.currency || '').toString().toUpperCase();
        const isUSD = currency === 'USD' || currency === '$' || currency === 'DOLLAR';

        let sellingPricePerCartonUSD: number;
        let sellingPricePerCartonILS: number;

        if (isUSD) {
          sellingPricePerCartonUSD = sp.specialPrice;
          sellingPricePerCartonILS = sp.specialPrice * usdToIls;
        } else {
          sellingPricePerCartonILS = sp.specialPrice;
          sellingPricePerCartonUSD = sp.specialPrice / usdToIls;
        }

        const pricing = {
          itemCode: item.itemCode,
          itemName: item.englishDescription,
          itemNameHe: item.nameHe,
          qtyPerCarton,
          boxCBM,
          priceSource: 'special_price',
          sellingPricePerCartonUSD: parseFloat(sellingPricePerCartonUSD.toFixed(2)),
          sellingPricePerUnitUSD: parseFloat((sellingPricePerCartonUSD / qtyPerCarton).toFixed(2)),
          usdToIls: parseFloat(usdToIls.toFixed(4)),
          sellingPricePerCartonILS: parseFloat(sellingPricePerCartonILS.toFixed(2)),
          sellingPricePerUnitILS: parseFloat((sellingPricePerCartonILS / qtyPerCarton).toFixed(2)),
          requestedQuantity,
          numberOfCartons,
          totalCBM: parseFloat(totalCBM.toFixed(3)),
          marginPercentage: 0,
          portOfOrigin,
          containerSizeCBM,
        };

        res.json({
          success: true,
          item: buildItemResponse(item),
          pricing,
        });
        return;
      }
    }

    // If missing critical fields for calculation (not special price), return error
    if (missingFields.length > 0) {
      res.status(400).json({
        error: true,
        message: 'לא ניתן לחשב מחיר - חסרים נתונים',
        missingFields,
        itemCode: item.itemCode,
        itemName: item.nameHe || item.englishDescription
      });
      return;
    }

    // No special price - calculate regular price
    // 1. Supplier price per carton (in USD)
    const supplierPricePerCarton = item.supplierPrice || 0;

    // 2. Freight cost from database
    const freightRate = await FreightRate.findOne({
      portOfOrigin,
      containerSizeCBM,
      isActive: true,
    }).sort({ validFrom: -1 });

    const freightCostPerContainer = freightRate ? freightRate.freightCost : 4700;
    const freightCostPerCBM = freightCostPerContainer / containerSizeCBM;
    const freightCostPerCarton = freightCostPerCBM * boxCBM;

    // 3. Total cost per carton (in USD)
    const totalCostPerCarton = supplierPricePerCarton + freightCostPerCarton;

    // 4. Margin percentage from database
    const marginRule = await MarginRule.findOne({
      categoryId: item.categoryId,
      isActive: true,
    }).sort({ validFrom: -1 });

    // If no margin rule found for category, return error
    if (!marginRule) {
      res.status(400).json({
        error: true,
        message: 'לא ניתן לחשב מחיר - חסר אחוז רווח לקטגוריה',
        missingFields: ['אחוז רווח'],
        itemCode: item.itemCode,
        itemName: item.nameHe || item.englishDescription,
        categoryId: item.categoryId
      });
      return;
    }

    const marginPercentage = marginRule.marginPercentage;

    // 5. Calculate selling price
    const calculatedPricePerCartonUSD = totalCostPerCarton * (1 + marginPercentage / 100);
    const calculatedPricePerCartonILS = calculatedPricePerCartonUSD * usdToIls;

    // 6. Compare with last sales order price (use higher price)
    let finalPricePerCartonUSD = calculatedPricePerCartonUSD;
    let finalPricePerCartonILS = calculatedPricePerCartonILS;
    let priceSource = 'calculated';

    if (item.lastSalesOrderPrice && item.lastSalesOrderPrice > 0) {
      const lastPriceCurrency = (item.lastSalesOrderCurrency || '').toString().toUpperCase();
      const isLastPriceUSD = lastPriceCurrency === 'USD' || lastPriceCurrency === '$';

      let lastPricePerCartonILS: number;
      let lastPricePerCartonUSD: number;

      if (isLastPriceUSD) {
        lastPricePerCartonUSD = item.lastSalesOrderPrice;
        lastPricePerCartonILS = item.lastSalesOrderPrice * usdToIls;
      } else {
        lastPricePerCartonILS = item.lastSalesOrderPrice;
        lastPricePerCartonUSD = item.lastSalesOrderPrice / usdToIls;
      }

      // Use higher price (last sale price if higher than calculated)
      if (lastPricePerCartonILS > calculatedPricePerCartonILS) {
        finalPricePerCartonILS = lastPricePerCartonILS;
        finalPricePerCartonUSD = lastPricePerCartonUSD;
        priceSource = 'last_sale';
      }
    }

    const pricing = {
      itemCode: item.itemCode,
      itemName: item.englishDescription,
      itemNameHe: item.nameHe,
      qtyPerCarton,
      boxCBM,
      supplierPricePerCarton: parseFloat(supplierPricePerCarton.toFixed(2)),
      priceSource,
      portOfOrigin,
      containerSizeCBM,
      freightCostPerContainer,
      freightCostPerCBM: parseFloat(freightCostPerCBM.toFixed(2)),
      freightCostPerCarton: parseFloat(freightCostPerCarton.toFixed(2)),
      totalCostPerCarton: parseFloat(totalCostPerCarton.toFixed(2)),
      marginPercentage,
      // Calculated prices (before comparison)
      calculatedPricePerCartonUSD: parseFloat(calculatedPricePerCartonUSD.toFixed(2)),
      calculatedPricePerUnitUSD: parseFloat((calculatedPricePerCartonUSD / qtyPerCarton).toFixed(2)),
      calculatedPricePerCartonILS: parseFloat(calculatedPricePerCartonILS.toFixed(2)),
      calculatedPricePerUnitILS: parseFloat((calculatedPricePerCartonILS / qtyPerCarton).toFixed(2)),
      // Final prices (after comparison with last sale)
      sellingPricePerCartonUSD: parseFloat(finalPricePerCartonUSD.toFixed(2)),
      sellingPricePerUnitUSD: parseFloat((finalPricePerCartonUSD / qtyPerCarton).toFixed(2)),
      sellingPricePerCartonILS: parseFloat(finalPricePerCartonILS.toFixed(2)),
      sellingPricePerUnitILS: parseFloat((finalPricePerCartonILS / qtyPerCarton).toFixed(2)),
      usdToIls: parseFloat(usdToIls.toFixed(4)),
      requestedQuantity,
      numberOfCartons,
      totalCBM: parseFloat(totalCBM.toFixed(3)),
      // Last sale info for reference
      lastSalesOrderPrice: item.lastSalesOrderPrice || null,
      lastSalesOrderCurrency: item.lastSalesOrderCurrency || null,
      lastSalesOrderDate: item.lastSalesOrderDate || null,
    };

    res.json({
      success: true,
      item: buildItemResponse(item),
      pricing,
    });
  })
);

/**
 * Helper to build item response object
 */
function buildItemResponse(item: any) {
  return {
    _id: item._id,
    itemCode: item.itemCode,
    englishDescription: item.englishDescription,
    nameHe: item.nameHe,
    imageUrl: item.imageUrl,
    categoryId: item.categoryId,
    qtyPerCarton: item.qtyPerCarton,
    boxCBM: item.boxCBM,
    cartonHeight: item.cartonHeight,
    cartonLength: item.cartonLength,
    cartonWidth: item.cartonWidth,
    lastSalesOrderPrice: item.lastSalesOrderPrice,
    lastSalesOrderCurrency: item.lastSalesOrderCurrency,
    lastSalesOrderDate: item.lastSalesOrderDate,
    lastSalesOrderNumber: item.lastSalesOrderNumber,
  };
}

export default router;
