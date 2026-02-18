import { z } from 'zod';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

/**
 * Environment variables schema
 * Validates all required environment variables at startup
 * Fails fast if any required variable is missing
 */
const envSchema = z.object({
  // Server
  PORT: z.coerce.number().default(5001),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),

  // Database
  MONGODB_URI: z.string().min(1, 'MONGODB_URI is required'),

  // JWT
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
  JWT_EXPIRES_IN: z.string().default('8h'),

  // CORS
  CLIENT_URL: z.string().default('http://localhost:5174'),

  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: z.coerce.number().default(900000), // 15 minutes
  RATE_LIMIT_MAX_REQUESTS: z.coerce.number().default(1000),
  RATE_LIMIT_ACTIVITY_WINDOW_MS: z.coerce.number().default(300000), // 5 minutes
  RATE_LIMIT_ACTIVITY_MAX_REQUESTS: z.coerce.number().default(600),
  RATE_LIMIT_SEARCH_WINDOW_MS: z.coerce.number().default(60000), // 1 minute
  RATE_LIMIT_SEARCH_MAX_REQUESTS: z.coerce.number().default(120),

  // Email (SMTP)
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().default(587),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  SMTP_FROM: z.string().email().optional(),
  ORDER_EMAIL_TO: z.string().optional(), // Email to receive order notifications
});

/**
 * Parse and validate environment variables
 */
const parseEnv = () => {
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    console.error('❌ Environment validation failed:');
    console.error(result.error.format());
    process.exit(1);
  }

  return result.data;
};

/**
 * Validated environment configuration
 * Use this throughout the application instead of process.env
 */
export const env = parseEnv();

/**
 * Check if running in production
 */
export const isProduction = env.NODE_ENV === 'production';

/**
 * Check if running in development
 */
export const isDevelopment = env.NODE_ENV === 'development';

/**
 * Check if running in test
 */
export const isTest = env.NODE_ENV === 'test';
