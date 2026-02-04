import { z } from 'zod';

// ============================================
// Authentication Schemas
// ============================================

/**
 * Login request schema
 * Validates login form data
 */
export const loginSchema = z.object({
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(50, 'Username too long')
    .toLowerCase()
    .trim(),
  password: z
    .string()
    .min(6, 'Password must be at least 6 characters')
    .max(100, 'Password too long'),
});

/**
 * Login response schema
 * Validates server response after successful login
 */
export const loginResponseSchema = z.object({
  token: z.string(),
  user: z.object({
    id: z.string(),
    username: z.string(),
    name: z.string(),
    email: z.string().email(),
    role: z.enum(['admin', 'sales', 'sales_agent', 'manager', 'accountant', 'logistics']),
  }),
});

/**
 * JWT payload schema
 * Structure of the decoded JWT token
 */
export const jwtPayloadSchema = z.object({
  id: z.string(),
  username: z.string(),
  iat: z.number(),
  exp: z.number(),
});

/**
 * Change password schema
 */
export const changePasswordSchema = z.object({
  currentPassword: z.string().min(6),
  newPassword: z
    .string()
    .min(8, 'New password must be at least 8 characters')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'Password must contain uppercase, lowercase and number'
    ),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

// ============================================
// Inferred Types
// ============================================

export type LoginInput = z.infer<typeof loginSchema>;
export type LoginResponse = z.infer<typeof loginResponseSchema>;
export type JwtPayload = z.infer<typeof jwtPayloadSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;

// ============================================
// User Roles
// ============================================

export const UserRole = {
  ADMIN: 'admin',
  SALES: 'sales',
  SALES_AGENT: 'sales_agent',
  MANAGER: 'manager',
  ACCOUNTANT: 'accountant',
  LOGISTICS: 'logistics',
} as const;

export type UserRole = (typeof UserRole)[keyof typeof UserRole];

/**
 * Role permissions mapping
 * Defines what each role can access
 */
export const RolePermissions: Record<UserRole, string[]> = {
  admin: ['*'], // All permissions
  sales: ['customers:read', 'customers:write', 'orders:read', 'orders:write', 'items:read'],
  sales_agent: ['customers:read', 'customers:write', 'orders:read', 'orders:write', 'items:read'],
  manager: ['customers:*', 'orders:*', 'items:read', 'reports:read', 'collection:*'],
  accountant: ['orders:read', 'reports:read', 'collection:*'],
  logistics: ['orders:read', 'inventory:*'],
};
