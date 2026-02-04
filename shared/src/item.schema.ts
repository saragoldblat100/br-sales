import { z } from 'zod';
import { objectIdSchema, CurrencyCode, PortOfOrigin } from './common.schema';

// ============================================
// Item Schemas
// ============================================

/**
 * Item dimensions schema
 */
export const itemDimensionsSchema = z.object({
  cartonWidth: z.number().min(0).default(0),
  cartonLength: z.number().min(0).default(0),
  cartonHeight: z.number().min(0).default(0),
  unitWeight: z.number().min(0).default(0),
  boxCBM: z.number().min(0).default(0),
});

/**
 * Item base schema
 * Core item properties
 */
export const itemBaseSchema = z.object({
  itemCode: z.string().min(1).max(50).trim(),
  barcode: z.string().max(50).optional(),
  englishDescription: z.string().min(1).max(500).trim(),
  nameHe: z.string().max(500).optional(),
  categoryId: objectIdSchema,
  qtyPerCarton: z.number().int().positive(),
  costPrice: z.number().min(0).optional(), // FOB price in USD
  sellingPrice: z.number().min(0).optional(), // Default selling price
  imageUrl: z.string().url().optional().or(z.literal('')),
  isActive: z.boolean().default(true),
  notes: z.string().optional(),
});

/**
 * Item document schema (from database)
 */
export const itemSchema = itemBaseSchema.merge(itemDimensionsSchema).extend({
  _id: objectIdSchema,
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

/**
 * Create item schema
 */
export const createItemSchema = itemBaseSchema.merge(itemDimensionsSchema);

/**
 * Update item schema
 */
export const updateItemSchema = itemBaseSchema
  .merge(itemDimensionsSchema)
  .partial()
  .extend({
    id: objectIdSchema,
  });

/**
 * Item search params
 */
export const itemSearchSchema = z.object({
  q: z.string().min(1).max(100),
  categoryId: objectIdSchema.optional(),
  limit: z.coerce.number().int().positive().max(100).default(20),
  activeOnly: z.coerce.boolean().default(true),
});

/**
 * Item price calculation request
 */
export const calculatePriceSchema = z.object({
  itemId: objectIdSchema,
  customerCode: z.string(),
  quantity: z.number().int().positive(),
  portOfOrigin: z.nativeEnum(PortOfOrigin).default(PortOfOrigin.SHENZHEN_YANTIAN),
  containerSizeCBM: z.number().positive().default(68),
});

/**
 * Item price calculation response
 */
export const calculatedPriceSchema = z.object({
  itemId: z.string(),
  itemCode: z.string(),
  basePrice: z.number(), // FOB price
  shippingCost: z.number(),
  customerDiscount: z.number(),
  specialPrice: z.number().optional(),
  finalPrice: z.number(), // Price per unit in ILS
  cartonPrice: z.number(), // Price per carton in ILS
  totalPrice: z.number(), // Total for quantity
  currency: z.nativeEnum(CurrencyCode),
  exchangeRate: z.number(),
});

/**
 * Item list item (for catalog display)
 */
export const itemListItemSchema = z.object({
  _id: z.string(),
  itemCode: z.string(),
  englishDescription: z.string(),
  nameHe: z.string().optional(),
  qtyPerCarton: z.number(),
  imageUrl: z.string().optional(),
  categoryId: z.string(),
  categoryName: z.string().optional(),
});

/**
 * Sales item - item with pricing info for sales view
 */
export const salesItemSchema = z.object({
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
  hasSpecialPrice: z.boolean().default(false),
  specialPrice: z.object({
    price: z.number(),
    currency: z.string(),
  }).optional().nullable(),
  lastSalesOrderPrice: z.number().optional(),
  lastSalesOrderCurrency: z.string().optional(),
  lastSalesOrderDate: z.coerce.date().optional(),
  lastSalesOrderNumber: z.string().optional(),
});

/**
 * Price source enum
 */
export const PriceSource = {
  SPECIAL_PRICE: 'specialPrice',
  LAST_SALE: 'lastSale',
  CALCULATED: 'calculated',
  MANUAL: 'manual',
} as const;

export type PriceSource = (typeof PriceSource)[keyof typeof PriceSource];

/**
 * Item pricing response (from calculate-price endpoint)
 */
export const itemPricingSchema = z.object({
  itemCode: z.string(),
  itemName: z.string().optional(),
  itemNameHe: z.string().optional(),
  qtyPerCarton: z.number(),
  boxCBM: z.number().optional(),

  // Final selling prices
  sellingPricePerCartonUSD: z.number().optional(),
  sellingPricePerUnitUSD: z.number().optional(),
  sellingPricePerCartonILS: z.number().optional(),
  sellingPricePerUnitILS: z.number().optional(),

  // Quantity info
  requestedQuantity: z.number().optional(),
  numberOfCartons: z.number().optional(),
  totalCBM: z.number().optional(),

  // Metadata
  marginPercentage: z.number().optional(),
  usdToIls: z.number().optional(),
  priceSource: z.string().optional(),
});

// ============================================
// Inferred Types
// ============================================

export type ItemDimensions = z.infer<typeof itemDimensionsSchema>;
export type ItemBase = z.infer<typeof itemBaseSchema>;
export type Item = z.infer<typeof itemSchema>;
export type CreateItemInput = z.infer<typeof createItemSchema>;
export type UpdateItemInput = z.infer<typeof updateItemSchema>;
export type ItemSearchParams = z.infer<typeof itemSearchSchema>;
export type CalculatePriceInput = z.infer<typeof calculatePriceSchema>;
export type CalculatedPrice = z.infer<typeof calculatedPriceSchema>;
export type ItemListItem = z.infer<typeof itemListItemSchema>;
export type SalesItem = z.infer<typeof salesItemSchema>;
export type ItemPricing = z.infer<typeof itemPricingSchema>;
