import { z } from 'zod';

// ============================================
// Common Schemas - Reusable validation patterns
// ============================================

/**
 * MongoDB ObjectId validation
 * Validates that a string is a valid 24-character hex ObjectId
 */
export const objectIdSchema = z
  .string()
  .regex(/^[0-9a-fA-F]{24}$/, 'Invalid ObjectId format');

/**
 * Pagination query parameters
 * Used for paginated API endpoints
 */
export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

/**
 * Date range filter
 * Used for filtering by date range
 */
export const dateRangeSchema = z.object({
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
});

/**
 * Sort options
 * Generic sorting schema
 */
export const sortSchema = z.object({
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// ============================================
// Inferred Types
// ============================================

export type ObjectId = z.infer<typeof objectIdSchema>;
export type Pagination = z.infer<typeof paginationSchema>;
export type DateRange = z.infer<typeof dateRangeSchema>;
export type SortOptions = z.infer<typeof sortSchema>;

// ============================================
// Common Enums
// ============================================

/**
 * Currency codes used in the system
 */
export const CurrencyCode = {
  USD: 'USD',
  ILS: 'ILS',
  EUR: 'EUR',
} as const;

export type CurrencyCode = (typeof CurrencyCode)[keyof typeof CurrencyCode];

/**
 * Ports of origin for shipping calculations
 */
export const PortOfOrigin = {
  SHENZHEN_YANTIAN: 'Shenzhen Yantian',
  NINGBO: 'Ningbo',
  SHANGHAI: 'Shanghai',
  QINGDAO: 'Qingdao',
} as const;

export type PortOfOrigin = (typeof PortOfOrigin)[keyof typeof PortOfOrigin];

/**
 * Container sizes in CBM
 */
export const ContainerSize = {
  CONTAINER_20: 28,
  CONTAINER_40: 58,
  CONTAINER_40HC: 68,
} as const;

export type ContainerSize = (typeof ContainerSize)[keyof typeof ContainerSize];
