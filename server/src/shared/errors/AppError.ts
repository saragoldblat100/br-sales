import { ApiErrorCode } from '@bravo/shared';

/**
 * Custom Application Error
 * Extends Error with additional properties for API responses
 */
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly isOperational: boolean;
  public readonly details?: Record<string, unknown>;

  constructor(
    message: string,
    statusCode: number = 500,
    code: string = ApiErrorCode.INTERNAL_ERROR,
    details?: Record<string, unknown>
  ) {
    super(message);

    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true; // Distinguishes operational errors from programming errors
    this.details = details;

    // Maintains proper stack trace
    Error.captureStackTrace(this, this.constructor);
  }

  /**
   * Create a 400 Bad Request error
   */
  static badRequest(message: string, details?: Record<string, unknown>): AppError {
    return new AppError(message, 400, ApiErrorCode.INVALID_INPUT, details);
  }

  /**
   * Create a 401 Unauthorized error
   */
  static unauthorized(message: string = 'Unauthorized'): AppError {
    return new AppError(message, 401, ApiErrorCode.UNAUTHORIZED);
  }

  /**
   * Create a 403 Forbidden error
   */
  static forbidden(message: string = 'Access denied'): AppError {
    return new AppError(message, 403, ApiErrorCode.FORBIDDEN);
  }

  /**
   * Create a 404 Not Found error
   */
  static notFound(resource: string = 'Resource'): AppError {
    return new AppError(`${resource} not found`, 404, ApiErrorCode.NOT_FOUND);
  }

  /**
   * Create a 409 Conflict error
   */
  static conflict(message: string): AppError {
    return new AppError(message, 409, ApiErrorCode.CONFLICT);
  }

  /**
   * Create a 422 Validation error
   */
  static validation(message: string, details?: Record<string, unknown>): AppError {
    return new AppError(message, 422, ApiErrorCode.VALIDATION_ERROR, details);
  }

  /**
   * Create a 429 Rate Limit error
   */
  static rateLimited(message: string = 'Too many requests'): AppError {
    return new AppError(message, 429, ApiErrorCode.RATE_LIMITED);
  }

  /**
   * Create a 500 Internal Server error
   */
  static internal(message: string = 'Internal server error'): AppError {
    return new AppError(message, 500, ApiErrorCode.INTERNAL_ERROR);
  }

  /**
   * Create a 503 Service Unavailable error
   */
  static serviceUnavailable(message: string = 'Service temporarily unavailable'): AppError {
    return new AppError(message, 503, ApiErrorCode.SERVICE_UNAVAILABLE);
  }
}
