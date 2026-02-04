import { z } from 'zod';
import { objectIdSchema } from './common.schema';

// ============================================
// User Schemas
// ============================================

/**
 * Base user schema
 * Core user properties
 */
export const userBaseSchema = z.object({
  username: z.string().min(3).max(50).toLowerCase().trim(),
  name: z.string().min(2).max(100).trim(),
  email: z.string().email().toLowerCase().trim(),
  role: z.enum(['admin', 'sales', 'sales_agent', 'manager', 'accountant', 'logistics']),
  isActive: z.boolean().default(true),
});

/**
 * User document schema (from database)
 * Includes MongoDB fields
 */
export const userSchema = userBaseSchema.extend({
  _id: objectIdSchema,
  lastLogin: z.coerce.date().optional(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

/**
 * Create user schema
 * For creating new users (includes password)
 */
export const createUserSchema = userBaseSchema.extend({
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'Password must contain uppercase, lowercase and number'
    ),
});

/**
 * Update user schema
 * All fields optional except id
 */
export const updateUserSchema = userBaseSchema.partial().extend({
  id: objectIdSchema,
});

/**
 * User public profile
 * Safe to send to client (no sensitive data)
 */
export const userProfileSchema = z.object({
  id: z.string(),
  username: z.string(),
  name: z.string(),
  email: z.string().email(),
  role: z.enum(['admin', 'sales', 'sales_agent', 'manager', 'accountant', 'logistics']),
  isActive: z.boolean(),
  lastLogin: z.coerce.date().optional(),
});

// ============================================
// Inferred Types
// ============================================

export type UserBase = z.infer<typeof userBaseSchema>;
export type User = z.infer<typeof userSchema>;
export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type UserProfile = z.infer<typeof userProfileSchema>;
