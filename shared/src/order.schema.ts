import { z } from 'zod';
import { objectIdSchema, CurrencyCode } from './common.schema';

// ============================================
// Order Schemas
// ============================================

/**
 * Order status enum
 */
export const OrderStatus = {
  QUOTE: 'quote',
  ORDER: 'order',
  PROCESSING: 'processing',
  SHIPPED: 'shipped',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled',
  CLOSED: 'closed',
} as const;

export type OrderStatus = (typeof OrderStatus)[keyof typeof OrderStatus];

/**
 * Order item schema
 * Single item in an order
 */
export const orderItemSchema = z.object({
  itemId: objectIdSchema,
  itemCode: z.string(),
  description: z.string(),
  quantity: z.number().int().positive(),
  unitPrice: z.number().min(0),
  cartonPrice: z.number().min(0),
  totalPrice: z.number().min(0),
  discount: z.number().min(0).max(100).default(0),
  notes: z.string().optional(),
});

/**
 * Order base schema
 * Core order properties
 */
export const orderBaseSchema = z.object({
  customerId: objectIdSchema,
  customerCode: z.string(),
  customerName: z.string(),
  status: z.nativeEnum(OrderStatus).default(OrderStatus.QUOTE),
  items: z.array(orderItemSchema).min(1, 'Order must have at least one item'),
  subtotal: z.number().min(0),
  discount: z.number().min(0).max(100).default(0),
  discountAmount: z.number().min(0).default(0),
  tax: z.number().min(0).default(0),
  taxAmount: z.number().min(0).default(0),
  totalAmount: z.number().min(0),
  currency: z.nativeEnum(CurrencyCode).default(CurrencyCode.ILS),
  exchangeRate: z.number().positive().default(1),
  notes: z.string().optional(),
  internalNotes: z.string().optional(),
  deliveryAddress: z.string().optional(),
  deliveryDate: z.coerce.date().optional(),
  salesAgentId: objectIdSchema.optional(),
  salesAgentName: z.string().optional(),
});

/**
 * Order document schema (from database)
 */
export const orderSchema = orderBaseSchema.extend({
  _id: objectIdSchema,
  orderNumber: z.string(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

/**
 * Create order schema
 */
export const createOrderSchema = orderBaseSchema.omit({
  subtotal: true,
  discountAmount: true,
  taxAmount: true,
  totalAmount: true,
});

/**
 * Update order schema
 */
export const updateOrderSchema = orderBaseSchema.partial().extend({
  id: objectIdSchema,
});

/**
 * Update order status schema
 */
export const updateOrderStatusSchema = z.object({
  id: objectIdSchema,
  status: z.nativeEnum(OrderStatus),
  notes: z.string().optional(),
});

/**
 * Order list item (for order list display)
 */
export const orderListItemSchema = z.object({
  _id: z.string(),
  orderNumber: z.string(),
  customerName: z.string(),
  status: z.nativeEnum(OrderStatus),
  totalAmount: z.number(),
  itemCount: z.number(),
  createdAt: z.coerce.date(),
  salesAgentName: z.string().optional(),
});

/**
 * Order filters
 */
export const orderFiltersSchema = z.object({
  status: z.nativeEnum(OrderStatus).optional(),
  customerId: objectIdSchema.optional(),
  salesAgentId: objectIdSchema.optional(),
  fromDate: z.coerce.date().optional(),
  toDate: z.coerce.date().optional(),
  minAmount: z.coerce.number().optional(),
  maxAmount: z.coerce.number().optional(),
});

// ============================================
// Inferred Types
// ============================================

export type OrderItem = z.infer<typeof orderItemSchema>;
export type OrderBase = z.infer<typeof orderBaseSchema>;
export type Order = z.infer<typeof orderSchema>;
export type CreateOrderInput = z.infer<typeof createOrderSchema>;
export type UpdateOrderInput = z.infer<typeof updateOrderSchema>;
export type UpdateOrderStatusInput = z.infer<typeof updateOrderStatusSchema>;
export type OrderListItem = z.infer<typeof orderListItemSchema>;
export type OrderFilters = z.infer<typeof orderFiltersSchema>;
