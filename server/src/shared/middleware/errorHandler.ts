import { Request, Response, NextFunction, ErrorRequestHandler } from 'express';
import { ZodError } from 'zod';
import { AppError } from '@/shared/errors';
import { isProduction } from '@/config/env';
import { logger } from '@/shared/utils';
import { ApiErrorCode } from '@bravo/shared';

/**
 * Global Error Handler Middleware
 *
 * Catches all errors thrown in the application and returns
 * a consistent JSON response format.
 *
 * Handles:
 * - AppError (our custom errors)
 * - ZodError (validation errors)
 * - Mongoose errors
 * - Generic errors
 */
export const errorHandler: ErrorRequestHandler = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  // Log the error
  logger.error('Error caught by handler:', err);

  // Handle our custom AppError
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      error: {
        code: err.code,
        message: err.message,
        ...(err.details && { details: err.details }),
      },
    });
    return;
  }

  // Handle Zod validation errors
  if (err instanceof ZodError) {
    const details = err.errors.reduce(
      (acc, error) => {
        const path = error.path.join('.');
        acc[path] = error.message;
        return acc;
      },
      {} as Record<string, string>
    );

    res.status(422).json({
      success: false,
      error: {
        code: ApiErrorCode.VALIDATION_ERROR,
        message: 'Validation failed',
        details,
      },
    });
    return;
  }

  // Handle Mongoose duplicate key error
  if (err.name === 'MongoServerError' && (err as any).code === 11000) {
    const field = Object.keys((err as any).keyValue)[0];
    res.status(409).json({
      success: false,
      error: {
        code: ApiErrorCode.ALREADY_EXISTS,
        message: `${field} already exists`,
        details: { field },
      },
    });
    return;
  }

  // Handle Mongoose validation error
  if (err.name === 'ValidationError') {
    res.status(422).json({
      success: false,
      error: {
        code: ApiErrorCode.VALIDATION_ERROR,
        message: err.message,
      },
    });
    return;
  }

  // Handle Mongoose CastError (invalid ObjectId)
  if (err.name === 'CastError') {
    res.status(400).json({
      success: false,
      error: {
        code: ApiErrorCode.INVALID_INPUT,
        message: 'Invalid ID format',
      },
    });
    return;
  }

  // Handle JWT errors
  if (err.name === 'JsonWebTokenError') {
    res.status(401).json({
      success: false,
      error: {
        code: ApiErrorCode.UNAUTHORIZED,
        message: 'Invalid token',
      },
    });
    return;
  }

  if (err.name === 'TokenExpiredError') {
    res.status(401).json({
      success: false,
      error: {
        code: ApiErrorCode.TOKEN_EXPIRED,
        message: 'Token expired',
      },
    });
    return;
  }

  // Generic error response
  // In production, don't expose error details
  res.status(500).json({
    success: false,
    error: {
      code: ApiErrorCode.INTERNAL_ERROR,
      message: isProduction ? 'Internal server error' : err.message,
      ...(!isProduction && { stack: err.stack }),
    },
  });
};

/**
 * 404 Not Found Handler
 * Catches requests to undefined routes
 */
export const notFoundHandler = (req: Request, res: Response): void => {
  res.status(404).json({
    success: false,
    error: {
      code: ApiErrorCode.NOT_FOUND,
      message: `Route ${req.method} ${req.path} not found`,
    },
  });
};
