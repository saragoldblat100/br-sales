import { z } from 'zod';
import { objectIdSchema } from './common.schema';

// ============================================
// Category Schemas
// ============================================

/**
 * Category base schema
 * Core category properties
 */
export const categoryBaseSchema = z.object({
  name: z.string().min(2).max(100).trim(),
  nameEn: z.string().min(2).max(100).trim().optional(),
  order: z.number().int().min(0).default(0),
  isActive: z.boolean().default(true),
  parentId: objectIdSchema.optional(),
  icon: z.string().optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
});

/**
 * Category document schema (from database)
 */
export const categorySchema = categoryBaseSchema.extend({
  _id: objectIdSchema,
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

/**
 * Create category schema
 */
export const createCategorySchema = categoryBaseSchema;

/**
 * Update category schema
 */
export const updateCategorySchema = categoryBaseSchema.partial().extend({
  id: objectIdSchema,
});

/**
 * Category list item (for navigation/selection)
 */
export const categoryListItemSchema = z.object({
  _id: z.string(),
  name: z.string(),
  nameEn: z.string().optional(),
  order: z.number(),
  itemCount: z.number().optional(),
});

// ============================================
// Inferred Types
// ============================================

export type CategoryBase = z.infer<typeof categoryBaseSchema>;
export type Category = z.infer<typeof categorySchema>;
export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;
export type CategoryListItem = z.infer<typeof categoryListItemSchema>;
