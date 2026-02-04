import { z } from 'zod';
import { objectIdSchema } from './common.schema';

// ============================================
// Customer Schemas
// ============================================

/**
 * Special price schema
 * Custom pricing for specific customers
 */
export const specialPriceSchema = z.object({
  itemCode: z.string(),
  specialPrice: z.number().positive(),
  currency: z.enum(['ILS', 'USD']).default('ILS'),
  validFrom: z.coerce.date().optional(),
  validTo: z.coerce.date().optional(),
  notes: z.string().optional(),
});

/**
 * Customer base schema
 * Core customer properties
 */
export const customerBaseSchema = z.object({
  customerCode: z.string().min(1).max(50).trim(),
  customerName: z.string().min(2).max(200).trim(),
  address: z.string().optional(),
  city: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  contactPerson: z.string().optional(),
  discount: z.number().min(0).max(100).default(0),
  paymentTerms: z.string().optional(),
  creditLimit: z.number().min(0).optional(),
  isActive: z.boolean().default(true),
  notes: z.string().optional(),
  specialPrices: z.array(specialPriceSchema).default([]),
});

/**
 * Customer document schema (from database)
 */
export const customerSchema = customerBaseSchema.extend({
  _id: objectIdSchema,
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

/**
 * Create customer schema
 */
export const createCustomerSchema = customerBaseSchema;

/**
 * Update customer schema
 */
export const updateCustomerSchema = customerBaseSchema.partial().extend({
  id: objectIdSchema,
});

/**
 * Customer search params
 */
export const customerSearchSchema = z.object({
  q: z.string().min(1).max(100),
  limit: z.coerce.number().int().positive().max(50).default(20),
  activeOnly: z.coerce.boolean().default(true),
});

/**
 * Customer list item (for dropdowns/lists)
 */
export const customerListItemSchema = z.object({
  _id: z.string(),
  customerCode: z.string(),
  customerName: z.string(),
  city: z.string().optional(),
});

/**
 * Customer type enum
 */
export const CustomerType = {
  EXISTING: 'Existing',
  PROSPECT: 'Prospect',
  INACTIVE: 'Inactive',
} as const;

export type CustomerType = (typeof CustomerType)[keyof typeof CustomerType];

/**
 * Customer with special prices response
 * Used when loading customer details for sales
 */
export const customerWithSpecialPricesSchema = z.object({
  customer: z.object({
    _id: z.string(),
    customerCode: z.string(),
    customerName: z.string(),
    customerType: z.string().optional(),
  }),
  itemsWithSpecialPrices: z.array(z.object({
    _id: z.string(),
    itemCode: z.string(),
    englishDescription: z.string().optional(),
    nameHe: z.string().optional(),
    imageUrl: z.string().optional(),
    qtyPerCarton: z.number().optional(),
    boxCBM: z.number().optional(),
    cartonHeight: z.number().optional(),
    cartonLength: z.number().optional(),
    cartonWidth: z.number().optional(),
    categoryId: z.any().optional(),
    specialPrice: z.number(),
    specialPriceCurrency: z.string(),
    hasSpecialPrice: z.boolean(),
    lastSalesOrderPrice: z.number().optional(),
    lastSalesOrderCurrency: z.string().optional(),
    lastSalesOrderDate: z.coerce.date().optional(),
    lastSalesOrderNumber: z.string().optional(),
  })),
});

// ============================================
// Inferred Types
// ============================================

export type SpecialPrice = z.infer<typeof specialPriceSchema>;
export type CustomerBase = z.infer<typeof customerBaseSchema>;
export type Customer = z.infer<typeof customerSchema>;
export type CreateCustomerInput = z.infer<typeof createCustomerSchema>;
export type UpdateCustomerInput = z.infer<typeof updateCustomerSchema>;
export type CustomerSearchParams = z.infer<typeof customerSearchSchema>;
export type CustomerListItem = z.infer<typeof customerListItemSchema>;
export type CustomerWithSpecialPrices = z.infer<typeof customerWithSpecialPricesSchema>;
