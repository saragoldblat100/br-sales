import { Router, Response } from 'express';
import { authenticate, authorize, AuthenticatedRequest } from '@/shared/middleware';
import { asyncHandler } from '@/shared/utils';
import { activityService } from './activity.service';

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * GET /api/activity/report?date=YYYY-MM-DD
 * Manager/Admin only - Get activity report for a date
 */
router.get(
  '/report',
  authorize(['manager', 'admin']),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const date = (req.query.date as string) || new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Jerusalem' });

    const report = await activityService.getReport(date);

    res.json({
      success: true,
      data: report,
    });
  })
);

/**
 * POST /api/activity/log-view
 * Log customer or item view from client
 */
router.post(
  '/log-view',
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { eventType, eventData } = req.body;

    if (!eventType || !['customer_view', 'item_view'].includes(eventType)) {
      res.status(400).json({ success: false, message: 'Invalid event type' });
      return;
    }

    await activityService.log(
      req.user!.id,
      req.user!.username,
      eventType,
      eventData || {}
    );

    res.json({ success: true });
  })
);

export default router;
