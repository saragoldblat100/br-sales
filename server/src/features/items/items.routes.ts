import { Router, Request, Response } from 'express';
import { authenticate, authorize, type AuthenticatedRequest } from '@/shared/middleware';
import { asyncHandler } from '@/shared/utils';
import { Item } from './item.model';
import { Category } from './category.model';
import { SpecialPrice } from './specialPrice.model';
import { FreightRate } from './freightRate.model';
import { MarginRule } from './marginRule.model';
import { getCurrentRate, getTodayRate } from '@/features/currency';
import { CurrencyRate } from '@/features/currency/currency.model';

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

    const usdToIls = usdRate.usdRateWithMargin;

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
 * POST /api/sales/items/:itemId/pricing-calculator
 * Admin/Manager only - Calculate price with parameter overrides (preview only, no save)
 */
router.post(
  '/items/:itemId/pricing-calculator',
  authorize(['admin', 'manager']),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { itemId } = req.params;
    const {
      portOfOrigin = 'Shenzhen Yantian',
      containerSizeCBM = 68,
      overrideSupplierPrice,
      overrideFreight,
      overrideMargin,
      overrideUsdRate,
      overrideBoxCBM,
      overrideQtyPerCarton,
    } = req.body;

    // Run all DB queries in parallel for speed
    const [item, todayRateDoc, freightRateDoc] = await Promise.all([
      Item.findById(itemId).populate('categoryId'),
      overrideUsdRate ? Promise.resolve(null) : getTodayRate(),
      overrideFreight !== undefined ? Promise.resolve(null) : FreightRate.findOne({ portOfOrigin, containerSizeCBM, isActive: true }).sort({ validFrom: -1 }),
    ]);

    if (!item) {
      res.status(404).json({ error: 'Item not found' });
      return;
    }

    // USD rate
    let usdToIls: number;
    let bankRate: number | null = null;
    let rateMarginPercent = 5;
    if (overrideUsdRate !== undefined && overrideUsdRate > 0) {
      usdToIls = overrideUsdRate;
    } else {
      // Prefer today's rate, otherwise use last valid system rate
      const latestRateDoc = todayRateDoc
        ? todayRateDoc
        : await CurrencyRate.findOne({ isActive: true }).sort({ date: -1 });

      if (latestRateDoc) {
        usdToIls = latestRateDoc.usdRateWithMargin;
        bankRate = latestRateDoc.usdRate;
        rateMarginPercent = latestRateDoc.marginPercentage;
      } else {
        // No rate in DB - try fetch/update (Bank of Israel)
        const systemRate = await getCurrentRate();
        if (!systemRate) {
          res.status(400).json({ error: true, message: 'אין שער דולר זמין במערכת', missingFields: ['שער דולר'] });
          return;
        }
        usdToIls = systemRate.usdRateWithMargin;
        const freshDoc = await getTodayRate();
        if (freshDoc) {
          bankRate = freshDoc.usdRate;
          rateMarginPercent = freshDoc.marginPercentage;
        }
      }
    }

    // Use overrides for CBM and qty if provided
    const qtyPerCarton = (overrideQtyPerCarton !== undefined && overrideQtyPerCarton > 0) ? overrideQtyPerCarton : (item.qtyPerCarton || 1);
    const boxCBM = (overrideBoxCBM !== undefined && overrideBoxCBM >= 0) ? overrideBoxCBM : (item.boxCBM || 0);

    // Validate required item fields (only if no override provided)
    const missingFields: string[] = [];
    if ((!item.supplierPrice || item.supplierPrice === 0) && overrideSupplierPrice === undefined) missingFields.push('מחיר ספק');
    if (boxCBM === 0) missingFields.push('נפח קרטון (CBM)');
    if (qtyPerCarton === 0) missingFields.push('כמות יחידות בקרטון');
    if (!item.categoryId && overrideMargin === undefined) missingFields.push('קטגוריה');

    if (missingFields.length > 0) {
      res.status(400).json({ error: true, message: 'לא ניתן לחשב מחיר - חסרים נתונים', missingFields, item: buildItemResponse(item) });
      return;
    }

    // 1. Supplier price
    const supplierPricePerCarton = (overrideSupplierPrice !== undefined && overrideSupplierPrice >= 0)
      ? overrideSupplierPrice : (item.supplierPrice || 0);

    // 2. Freight
    let freightCostPerContainer: number;
    let freightSource = 'database';
    if (overrideFreight !== undefined && overrideFreight >= 0) {
      freightCostPerContainer = overrideFreight;
      freightSource = 'override';
    } else {
      freightCostPerContainer = freightRateDoc ? freightRateDoc.freightCost : 4700;
    }
    const freightCostPerCBM = freightCostPerContainer / containerSizeCBM;
    const freightCostPerCarton = freightCostPerCBM * boxCBM;

    // 3. Total cost
    const totalCostPerCarton = supplierPricePerCarton + freightCostPerCarton;

    // 4. Margin - fetch only if not overridden (use pre-fetched item.categoryId)
    let marginPercentage: number;
    let marginSource = 'database';
    if (overrideMargin !== undefined && overrideMargin >= 0) {
      marginPercentage = overrideMargin;
      marginSource = 'override';
    } else {
      const marginRule = await MarginRule.findOne({ categoryId: item.categoryId, isActive: true }).sort({ validFrom: -1 });
      if (!marginRule) {
        res.status(400).json({ error: true, message: 'לא ניתן לחשב מחיר - חסר אחוז רווח לקטגוריה', missingFields: ['אחוז רווח'], item: buildItemResponse(item) });
        return;
      }
      marginPercentage = marginRule.marginPercentage;
    }

    // 5. Calculate
    const calculatedPricePerCartonUSD = totalCostPerCarton * (1 + marginPercentage / 100);
    const calculatedPricePerCartonILS = calculatedPricePerCartonUSD * usdToIls;

    // 6. Last sale reference
    let lastSaleInfo: { priceILS: number; priceUSD: number; currency: string; date?: string } | null = null;
    if (item.lastSalesOrderPrice && item.lastSalesOrderPrice > 0) {
      const lastCurrency = (item.lastSalesOrderCurrency || '').toString().toUpperCase();
      const isUSD = lastCurrency === 'USD' || lastCurrency === '$';
      lastSaleInfo = {
        priceILS: isUSD ? item.lastSalesOrderPrice * usdToIls : item.lastSalesOrderPrice,
        priceUSD: isUSD ? item.lastSalesOrderPrice : item.lastSalesOrderPrice / usdToIls,
        currency: lastCurrency || 'ILS',
        date: item.lastSalesOrderDate?.toISOString(),
      };
    }

    // Category name
    const categoryName = item.categoryId && typeof item.categoryId === 'object'
      ? (item.categoryId as any).nameHe || (item.categoryId as any).name || '' : '';

    res.json({
      success: true,
      item: buildItemResponse(item),
      pricingChain: {
        supplierPricePerCarton: parseFloat(supplierPricePerCarton.toFixed(2)),
        freightCostPerContainer,
        freightCostPerCBM: parseFloat(freightCostPerCBM.toFixed(2)),
        freightCostPerCarton: parseFloat(freightCostPerCarton.toFixed(2)),
        freightSource,
        portOfOrigin,
        containerSizeCBM,
        totalCostPerCarton: parseFloat(totalCostPerCarton.toFixed(2)),
        marginPercentage,
        marginSource,
        categoryName,
        calculatedPricePerCartonUSD: parseFloat(calculatedPricePerCartonUSD.toFixed(2)),
        calculatedPricePerUnitUSD: parseFloat((calculatedPricePerCartonUSD / qtyPerCarton).toFixed(2)),
        usdToIls: parseFloat(usdToIls.toFixed(4)),
        bankRate: bankRate ? parseFloat(bankRate.toFixed(4)) : null,
        rateMarginPercent,
        usdRateSource: overrideUsdRate ? 'override' : 'system',
        calculatedPricePerCartonILS: parseFloat(calculatedPricePerCartonILS.toFixed(2)),
        calculatedPricePerUnitILS: parseFloat((calculatedPricePerCartonILS / qtyPerCarton).toFixed(2)),
        lastSaleInfo,
        qtyPerCarton,
        boxCBM,
      },
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
    lastPurchaseDate: item.lastPurchaseDate,
    lastPurchasePrice: item.lastPurchasePrice,
    lastSalesOrderPrice: item.lastSalesOrderPrice,
    lastSalesOrderCurrency: item.lastSalesOrderCurrency,
    lastSalesOrderDate: item.lastSalesOrderDate,
    lastSalesOrderNumber: item.lastSalesOrderNumber,
  };
}

export default router;
