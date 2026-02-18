import { Router, Request, Response } from 'express';
import { authenticate, authorize } from '@/shared/middleware';
import { asyncHandler } from '@/shared/utils';
import { getCurrentRate, updateTodayRate, createManualRate } from './currency.service';
import { CurrencyRate } from './currency.model';

const router = Router();

/**
 * GET /api/currency/current - שליפת שער הדולר הנוכחי
 */
router.get(
  '/current',
  authenticate,
  asyncHandler(async (_req: Request, res: Response) => {
    const rate = await getCurrentRate();

    if (!rate) {
      res.status(404).json({
        success: false,
        error: { message: 'אין שער דולר זמין' },
      });
      return;
    }
    res.json({
      success: true,
      rate: {
        date: rate.date,
        usdRate: rate.usdRate,
        usdRateWithMargin: rate.usdRateWithMargin,
        marginPercentage: rate.marginPercentage,
        source: rate.source,
      },
    });
  })
);

/**
 * POST /api/currency/update - עדכון אוטומטי מבנק ישראל
 */
router.post(
  '/update',
  authenticate,
  authorize(['admin', 'manager']),
  asyncHandler(async (req: Request, res: Response) => {
    const { marginPercentage } = req.body;

    const rate = await updateTodayRate(marginPercentage || 5);

    if (!rate) {
      res.status(400).json({
        success: false,
        error: { message: 'לא ניתן לעדכן שער דולר' },
      });
      return;
    }

    res.json({
      success: true,
      message: 'שער הדולר עודכן בהצלחה',
      rate: rate.usdRateWithMargin,
      data: {
        date: rate.date,
        usdRate: rate.usdRate,
        usdRateWithMargin: rate.usdRateWithMargin,
        marginPercentage: rate.marginPercentage,
        source: rate.source,
      },
    });
  })
);

/**
 * POST /api/currency/manual - הכנסת שער דולר ידנית
 */
router.post(
  '/manual',
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const { usdRate, marginPercentage } = req.body;

    if (!usdRate || isNaN(parseFloat(usdRate))) {
      res.status(400).json({
        success: false,
        error: { message: 'שער דולר לא תקין' },
      });
      return;
    }

    const rate = await createManualRate(parseFloat(usdRate), marginPercentage || 5);

    res.json({
      success: true,
      message: 'שער דולר ידני נשמר בהצלחה',
      rate: {
        date: rate.date,
        usdRate: rate.usdRate,
        usdRateWithMargin: rate.usdRateWithMargin,
        marginPercentage: rate.marginPercentage,
        source: rate.source,
      },
    });
  })
);

/**
 * GET /api/currency/history - היסטוריית שערי מטבע
 */
router.get(
  '/history',
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const limit = parseInt(req.query.limit as string) || 30;

    const rates = await CurrencyRate.find().sort({ date: -1 }).limit(limit);

    res.json({
      success: true,
      rates: rates.map((r) => ({
        date: r.date,
        usdRate: r.usdRate,
        usdRateWithMargin: r.usdRateWithMargin,
        marginPercentage: r.marginPercentage,
        source: r.source,
      })),
    });
  })
);

export default router;
