import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '@/config/env';
import { AppError } from '@/shared/errors';
import { UserRole, JwtPayload } from '@bravo/shared';

/**
 * Extended Request with authenticated user
 */
export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    username: string;
    role?: UserRole;
  };
}

/**
 * Authentication Middleware
 *
 * Verifies JWT token from Authorization header.
 * Attaches user information to request object.
 *
 * Usage:
 * ```ts
 * router.get('/protected', authenticate, (req, res) => {
 *   const userId = req.user.id;
 * });
 * ```
 */
export const authenticate = (
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
): void => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw AppError.unauthorized('No token provided');
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify token
    const decoded = jwt.verify(token, env.JWT_SECRET) as JwtPayload;

    // Attach user to request
    req.user = {
      id: decoded.id,
      username: decoded.username,
    };

    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      next(AppError.unauthorized('Invalid token'));
    } else if (error instanceof jwt.TokenExpiredError) {
      next(AppError.unauthorized('Token expired'));
    } else {
      next(error);
    }
  }
};

/**
 * Role Authorization Middleware Factory
 *
 * Creates a middleware that checks if the authenticated user
 * has one of the allowed roles.
 *
 * Usage:
 * ```ts
 * router.delete('/users/:id', authenticate, authorize(['admin']), deleteUser);
 * router.get('/reports', authenticate, authorize(['admin', 'manager']), getReports);
 * ```
 */
export const authorize = (allowedRoles: UserRole[]) => {
  return (req: AuthenticatedRequest, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(AppError.unauthorized('Not authenticated'));
      return;
    }

    if (!req.user.role || !allowedRoles.includes(req.user.role)) {
      next(AppError.forbidden('Insufficient permissions'));
      return;
    }

    next();
  };
};

/**
 * Optional Authentication Middleware
 *
 * Attempts to authenticate but doesn't fail if no token is provided.
 * Useful for routes that work differently for authenticated vs anonymous users.
 */
export const optionalAuth = (
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
): void => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      next();
      return;
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, env.JWT_SECRET) as JwtPayload;

    req.user = {
      id: decoded.id,
      username: decoded.username,
    };

    next();
  } catch {
    // Token invalid, but that's okay for optional auth
    next();
  }
};
