import { Request, Response } from 'express';
import type { AuthenticatedRequest } from '@/shared/middleware';
import { Order } from './order.model';
import { User } from '@/features/auth/auth.model';
import { OrderLog } from './orderLog.model';
import { getNextOrderNumber } from './orderNumber';
import { sendOrderEmail } from './email.service';
import { asyncHandler } from '@/shared/utils';
import { logger } from '@/shared/utils';
import { activityService } from '@/features/activity';

/**
 * Create a new order
 * - quote/draft: Save full order as draft (can be loaded later)
 * - order: Send email + save only log (not full order)
 */
export const createOrder = asyncHandler(async (req: Request, res: Response) => {
  const { customerId, customerCode, customerName, lines, status, notes } = req.body;
  const userId = (req as AuthenticatedRequest).user?.id;
  const userName = (req as AuthenticatedRequest).user?.name || (req as AuthenticatedRequest).user?.username;

  // Calculate totals
  const totalCBM = lines.reduce((sum: number, line: any) => sum + (line.cbm || 0), 0);
  const totalAmountILS = lines
    .filter((line: any) => line.currency === 'ILS')
    .reduce((sum: number, line: any) => sum + line.totalPrice, 0);
  const totalAmountUSD = lines
    .filter((line: any) => line.currency === 'USD')
    .reduce((sum: number, line: any) => sum + line.totalPrice, 0);

  // If it's a sent order - save in both OrderLog AND Order collection
  if (status === 'order') {
    const orderNumber = await getNextOrderNumber();
    // Create order log (summary only)
    const orderLog = new OrderLog({
      orderNumber,
      customerId,
      customerCode,
      customerName,
      itemsSummary: lines.map((line: any) => ({
        itemCode: line.itemCode,
        description: line.description,
        cartons: line.cartons,
        quantity: line.quantity,
      })),
      totalCBM,
      totalAmountILS,
      totalAmountUSD,
      notes,
      sentAt: new Date(),
      createdBy: userId,
      createdByName: userName,
    });

    await orderLog.save();

    // Also save to Order collection with status='order'
    const orderInCollection = new Order({
      orderNumber,
      customerId,
      customerCode,
      customerName,
      lines,
      status: 'order',
      notes,
      totalCBM,
      totalAmountILS,
      totalAmountUSD,
      createdBy: userId,
      createdByName: userName,
    });

    await orderInCollection.save();

    // Create temporary order object for email (not saved to DB)
    const orderForEmail = {
      orderNumber,
      customerId,
      customerCode,
      customerName,
      lines,
      status: 'order',
      notes,
      totalCBM,
      totalAmountILS,
      totalAmountUSD,
    };

    // Send email notification
    sendOrderEmail(orderForEmail as any).catch((error) => {
      logger.error('Failed to send order email:', error);
    });

    // Delete any existing draft for this customer
    await Order.deleteMany({ customerId, status: 'draft' });

    // Log activity
    const username = (req as AuthenticatedRequest).user?.username;
    if (userId && username) {
      activityService.log(userId, username, 'order_create', {
        orderNumber: orderLog.orderNumber,
        customerName,
        totalAmountILS,
        totalAmountUSD,
      });
    }

    return res.status(201).json({
      success: true,
      order: {
        _id: orderLog._id,
        orderNumber: orderLog.orderNumber,
        status: 'sent',
        totalCBM: orderLog.totalCBM,
        totalAmount: totalAmountILS > 0 ? totalAmountILS : totalAmountUSD,
        createdAt: orderLog.sentAt,
      },
    });
  }

  // For draft/quote - save or update full order
  let order;
  const existingDraft = await Order.findOne({ customerId, status: 'draft' });

  if (existingDraft) {
    // Update existing draft
    existingDraft.lines = lines;
    existingDraft.notes = notes;
    existingDraft.totalCBM = totalCBM;
    existingDraft.totalAmountILS = totalAmountILS;
    existingDraft.totalAmountUSD = totalAmountUSD;
    if (userId) {
      existingDraft.createdBy = userId;
    }
    if (userName) {
      existingDraft.createdByName = userName;
    }
    await existingDraft.save();
    order = existingDraft;
  } else {
    // Create new draft
    const orderNumber = await getNextOrderNumber();
    order = new Order({
      orderNumber,
      customerId,
      customerCode,
      customerName,
      lines,
      status: 'draft',
      notes,
      totalCBM,
      totalAmountILS,
      totalAmountUSD,
      createdBy: userId,
      createdByName: userName,
    });
    await order.save();
  }

  res.status(201).json({
    success: true,
    order: {
      _id: order._id,
      orderNumber: order.orderNumber,
      status: order.status,
      totalCBM: order.totalCBM,
      totalAmount: totalAmountILS > 0 ? totalAmountILS : totalAmountUSD,
      createdAt: order.createdAt,
    },
  });
});

/**
 * Get draft order for a customer
 */
export const getDraftOrder = asyncHandler(async (req: Request, res: Response) => {
  const { customerId } = req.params;
  const draft = await Order.findOne({
    customerId,
    status: 'draft',
  });

  if (!draft) {
    return res.json({
      success: true,
      data: null,
    });
  }

  res.json({
    success: true,
    data: draft,
  });
});

/**
 * Get all orders (for admin)
 */
export const getOrders = asyncHandler(async (req: Request, res: Response) => {
  const { status, customerId, limit = 50, skip = 0 } = req.query;
  const userId = (req as AuthenticatedRequest).user?.id;
  const userRole = (req as AuthenticatedRequest).user?.role;
  const isPrivileged = ['admin', 'manager', 'accountant'].includes(userRole || '');
  const includeManagerOrders = ['sales', 'sales_agent'].includes(userRole || '');
  const managerIds = includeManagerOrders
    ? (await User.find({ role: 'manager' }).select('_id').lean()).map((u) => u._id.toString())
    : [];

  const filter: any = {};
  if (status) filter.status = status;
  if (customerId) filter.customerId = customerId;

  // For draft orders - only show the user's own drafts (non-privileged roles)
  if (status === 'draft' && userId && !isPrivileged) {
    filter.createdBy = includeManagerOrders
      ? { $in: [userId, ...managerIds] }
      : userId;
  }

  // For sent orders - exclude closed/cancelled (show only active sent orders)
  // Also filter by user who created the order
  if (status === 'order') {
    filter.status = { $in: ['order', 'pending', 'approved', 'deposit_received'] };
    if (userId && !isPrivileged) {
      filter.createdBy = includeManagerOrders
        ? { $in: [userId, ...managerIds] }
        : userId;
    }
  }

  const orders = await Order.find(filter)
    .sort({ createdAt: -1 })
    .skip(Number(skip))
    .limit(Number(limit));

  const total = await Order.countDocuments(filter);

  res.json({
    success: true,
    data: orders,
    pagination: {
      total,
      limit: Number(limit),
      skip: Number(skip),
    },
  });
});

/**
 * Update order status
 */
export const updateOrderStatus = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { status } = req.body;

  const validStatuses = ['pending', 'approved', 'deposit_received', 'closed', 'cancelled'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ success: false, message: 'סטטוס לא תקין' });
  }

  const order = await Order.findByIdAndUpdate(
    id,
    { status },
    { new: true }
  );

  if (!order) {
    return res.status(404).json({ success: false, message: 'הזמנה לא נמצאה' });
  }

  // Log activity
  const userId = (req as AuthenticatedRequest).user?.id;
  const username = (req as AuthenticatedRequest).user?.username;
  if (userId && username) {
    activityService.log(userId, username, 'order_status_update', {
      orderNumber: order.orderNumber,
      newStatus: status,
    });
  }

  res.json({
    success: true,
    data: order,
  });
});

/**
 * Get single order by ID
 */
export const getOrderById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const order = await Order.findById(id);

  if (!order) {
    return res.status(404).json({
      success: false,
      error: { code: 'NOT_FOUND', message: 'Order not found' },
    });
  }

  res.json({
    success: true,
    data: order,
  });
});

/**
 * Get sent orders from Order collection
 * Returns orders that have been sent (status != 'draft' and status != 'quote')
 */
export const getSentOrders = asyncHandler(async (req: Request, res: Response) => {
  const { limit = 50, skip = 0 } = req.query;
  const userId = (req as AuthenticatedRequest).user?.id;
  const userRole = (req as AuthenticatedRequest).user?.role;
  const isPrivileged = ['admin', 'manager', 'accountant'].includes(userRole || '');
  const includeManagerOrders = ['sales', 'sales_agent'].includes(userRole || '');
  const managerIds = includeManagerOrders
    ? (await User.find({ role: 'manager' }).select('_id').lean()).map((u) => u._id.toString())
    : [];

  const filter: any = {
    // Only show orders that were sent (have 'order', 'pending', 'approved', or 'deposit_received' status)
    status: { $in: ['order', 'pending', 'approved', 'deposit_received'] },
  };

  // Optional: filter by the user who created this order (non-privileged roles)
  if (userId && !isPrivileged) {
    filter.createdBy = includeManagerOrders
      ? { $in: [userId, ...managerIds] }
      : userId;
  }

  const logs = await Order.find(filter)
    .sort({ createdAt: -1 })
    .skip(Number(skip))
    .limit(Number(limit));

  const total = await Order.countDocuments(filter);

  res.json({
    success: true,
    data: logs,
    pagination: {
      total,
      limit: Number(limit),
      skip: Number(skip),
    },
  });
});
