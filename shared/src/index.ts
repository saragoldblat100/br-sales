/**
 * @bravo/shared
 * Shared types and validation schemas for Bravo Sales Application
 *
 * This package contains:
 * - Zod validation schemas
 * - TypeScript types (inferred from Zod)
 * - API DTOs (Data Transfer Objects)
 * - Common enums and constants
 */

// Auth schemas and types
export * from './auth.schema';

// User schemas and types
export * from './user.schema';

// Customer schemas and types
export * from './customer.schema';

// Item schemas and types
export * from './item.schema';

// Order schemas and types
export * from './order.schema';

// Category schemas and types
export * from './category.schema';

// Common types and utilities
export * from './common.schema';

// API response types
export * from './api.types';
