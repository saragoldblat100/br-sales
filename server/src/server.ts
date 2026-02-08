import { createApp } from './app';
import { env } from '@/config/env';
import { connectDB, disconnectDB } from '@/config/db';
import { logger } from '@/shared/utils';
import { updateTodayRate } from '@/features/currency';

/**
 * Start the server
 */
const startServer = async (): Promise<void> => {
  try {
    // Connect to database
    const dbConnected = await connectDB();

    if (!dbConnected) {
      logger.error('Failed to connect to database. Exiting...');
      process.exit(1);
    }

    // Update USD rate from Bank of Israel on startup
    setTimeout(async () => {
      try {
        const rate = await updateTodayRate();
        if (rate) {
          logger.info(`שער דולר להיום: ${rate.usdRateWithMargin} ₪ (כולל מרווח ${rate.marginPercentage}%)`);
        } else {
          logger.warn('לא ניתן לעדכן שער דולר - יש להזין שער ידנית');
        }
      } catch (error) {
        logger.error('שגיאה בעדכון שער דולר:', error);
      }
    }, 2000);

    // Create Express app
    const app = createApp();

    // Start listening
    const server = app.listen(env.PORT, () => {
      logger.info(` Server running on port ${env.PORT}`);
      logger.info(` Environment: ${env.NODE_ENV}`);
      logger.info(` API: http://localhost:${env.PORT}/api`);
      logger.info(` Health: http://localhost:${env.PORT}/health`);
    });

    // Graceful shutdown handlers
    const gracefulShutdown = async (signal: string): Promise<void> => {
      logger.info(`${signal} received. Shutting down gracefully...`);

      server.close(async () => {
        logger.info('HTTP server closed');

        await disconnectDB();
        logger.info('Database connection closed');

        process.exit(0);
      });

      // Force shutdown after 30 seconds
      setTimeout(() => {
        logger.error('Forced shutdown after timeout');
        process.exit(1);
      }, 30000);
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    // Handle uncaught exceptions
    process.on('uncaughtException', (error: Error) => {
      logger.error('Uncaught Exception:', error);
      process.exit(1);
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason: unknown) => {
      logger.error('Unhandled Rejection:', reason);
      process.exit(1);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Start the server
startServer();
