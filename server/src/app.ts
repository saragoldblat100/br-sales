import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { env, isDevelopment } from '@/config/env';
import { errorHandler, notFoundHandler } from '@/shared/middleware';
import { logger } from '@/shared/utils';

// Feature routes
import { authRoutes } from '@/features/auth';
import { customerRoutes } from '@/features/customers';
import { currencyRoutes } from '@/features/currency';
import { itemsRoutes } from '@/features/items';
import { orderRoutes } from '@/features/orders';
import { collectionRoutes } from '@/features/collection';
import { inventoryRoutes } from '@/features/inventory';
import { activityRoutes } from '@/features/activity';
import { userRoutes } from '@/features/users';

/**
 * Create and configure Express application
 */
export const createApp = (): Application => {
  const app = express();

  // Trust first proxy (Render) - required for rate limiter to work correctly
  app.set('trust proxy', 1);

  // ============================================
  // Security Middleware
  // ============================================

  // Helmet - Sets various HTTP headers for security
  app.use(helmet());

  // CORS - Cross-Origin Resource Sharing
  const allowedOrigins = [
    env.CLIENT_URL,
    ...(isDevelopment
      ? ['http://localhost:5174', 'http://localhost:5173', 'http://localhost:3000']
      : []),
  ].filter(Boolean);

  app.use(
    cors({
      origin: (origin, callback) => {
        // Allow requests with no origin (server-to-server) only in development
        if (!origin) {
          return callback(null, isDevelopment);
        }

        if (allowedOrigins.includes(origin)) {
          return callback(null, true);
        }

        logger.warn(`CORS blocked origin: ${origin}`);
        callback(new Error('Not allowed by CORS'), false);
      },
      credentials: true,
    })
  );

  // Rate Limiting - Prevent abuse
  const limiter = rateLimit({
    windowMs: env.RATE_LIMIT_WINDOW_MS,
    max: env.RATE_LIMIT_MAX_REQUESTS,
    message: {
      success: false,
      error: {
        code: 'RATE_LIMITED',
        message: 'Too many requests, please try again later',
      },
    },
    standardHeaders: true,
    legacyHeaders: false,
  });

  app.use('/api', limiter);

  // Strict rate limit on login - 5 attempts per 15 minutes
  const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    message: {
      success: false,
      error: {
        code: 'TOO_MANY_LOGIN_ATTEMPTS',
        message: 'יותר מדי ניסיונות כניסה, נסה שוב בעוד 15 דקות',
      },
    },
    standardHeaders: true,
    legacyHeaders: false,
  });
  app.use('/api/auth/login', loginLimiter);

  // ============================================
  // Body Parsing Middleware
  // ============================================

  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // ============================================
  // Logging Middleware
  // ============================================

  if (isDevelopment) {
    app.use(morgan('dev'));
  } else {
    app.use(morgan('combined'));
  }

  // ============================================
  // Health Check
  // ============================================

  app.get('/health', (_req, res) => {
    res.json({
      success: true,
      data: {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        environment: env.NODE_ENV,
      },
    });
  });

  // ============================================
  // API Routes
  // ============================================

  app.use('/api/auth', authRoutes);
  app.use('/api/sales/customers', customerRoutes);
  app.use('/api/currency', currencyRoutes);
  app.use('/api/sales', itemsRoutes); // categories, items/search, items/category, items/recent, items/with-images
  app.use('/api/sales/orders', orderRoutes);
  app.use('/api/collection', collectionRoutes);
  app.use('/api/inventory', inventoryRoutes);
  app.use('/api/activity', activityRoutes);
  app.use('/api/admin/users', userRoutes);

  // ============================================
  // Error Handling
  // ============================================

  // 404 handler - must be after all routes
  app.use(notFoundHandler);

  // Global error handler - must be last
  app.use(errorHandler);

  return app;
};
