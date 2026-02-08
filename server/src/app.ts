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

/**
 * Create and configure Express application
 */
export const createApp = (): Application => {
  const app = express();

  // ============================================
  // Security Middleware
  // ============================================

  // Helmet - Sets various HTTP headers for security
  app.use(helmet());

  // CORS - Cross-Origin Resource Sharing
  app.use(
    cors({
      origin: (origin, callback) => {
        // Allow requests with no origin (mobile apps, Postman, etc.) in development
        if (!origin) {
          if (isDevelopment) {
            return callback(null, true);
          }
          return callback(null, true); // Allow for server-to-server requests
        }

        // Check against allowed origins
        const allowedOrigins = [
          env.CLIENT_URL,
          'http://localhost:5174',
          'http://localhost:5173',
          'http://localhost:3000',
        ];

        // Allow Render.com URLs
        if (origin.endsWith('.onrender.com')) {
          return callback(null, true);
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

  // ============================================
  // Error Handling
  // ============================================

  // 404 handler - must be after all routes
  app.use(notFoundHandler);

  // Global error handler - must be last
  app.use(errorHandler);

  return app;
};
