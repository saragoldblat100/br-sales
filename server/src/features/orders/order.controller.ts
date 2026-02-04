import { Request, Response } from 'express';
import { Order } from './order.model';
import { OrderLog } from './orderLog.model';
import { sendOrderEmail } from './email.service';
import { asyncHandler } from '@/shared/utils';
import { logger } from '@/shared/utils';

/**
 * Create a new order
 * - quote/draft: Save full order as draft (can be loaded later)
 * - order: Send email + save only log (not full order)
 */
export const createOrder = asyncHandler(async (req: Request, res: Response) => {
  const { customerId, customerCode, customerName, lines, status, notes } = req.body;

  // Calculate totals
  const totalCBM = lines.reduce((sum: number, line: any) => sum + (line.cbm || 0), 0);
  const totalAmountILS = lines
    .filter((line: any) => line.currency === 'ILS')
    .reduce((sum: number, line: any) => sum + line.totalPrice, 0);
  const totalAmountUSD = lines
    .filter((line: any) => line.currency === 'USD')
    .reduce((sum: number, line: any) => sum + line.totalPrice, 0);

  // If it's a sent order - save only log and send email
  if (status === 'order') {
    // Create order log (summary only)
    const orderLog = new OrderLog({
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
      createdBy: (req as any).user?.id,
    });

    await orderLog.save();

    // Create temporary order object for email (not saved to DB)
    const orderForEmail = {
      orderNumber: orderLog.orderNumber,
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

  // For draft/quote - save full order
  // First, delete any existing draft for this customer
  await Order.deleteMany({ customerId, status: 'draft' });

  const order = new Order({
    customerId,
    customerCode,
    customerName,
    lines,
    status: 'draft',
    notes,
    totalCBM,
    totalAmountILS,
    totalAmountUSD,
    createdBy: (req as any).user?.id,
  });

  await order.save();

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

  const draft = await Order.findOne({ customerId, status: 'draft' });

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

  const filter: any = {};
  if (status) filter.status = status;
  if (customerId) filter.customerId = customerId;

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
