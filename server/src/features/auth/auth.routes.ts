import { Router } from 'express';
import { authController } from './auth.controller';
import { authenticate, validateBody } from '@/shared/middleware';
import { asyncHandler } from '@/shared/utils';
import { loginSchema, changePasswordSchema } from '@bravo/shared';

/**
 * Authentication Routes
 *
 * Base path: /api/auth
 */
const router = Router();

/**
 * POST /api/auth/login
 * Public - Authenticate user
 */
router.post(
  '/login',
  validateBody(loginSchema),
  asyncHandler(authController.login)
);

/**
 * GET /api/auth/me
 * Protected - Get current user profile
 */
router.get(
  '/me',
  authenticate,
  asyncHandler(authController.getProfile)
);

/**
 * POST /api/auth/change-password
 * Protected - Change password
 */
router.post(
  '/change-password',
  authenticate,
  validateBody(changePasswordSchema),
  asyncHandler(authController.changePassword)
);

/**
 * POST /api/auth/logout
 * Public - Logout (client-side)
 */
router.post(
  '/logout',
  asyncHandler(authController.logout)
);

/**
 * POST /api/auth/verify
 * Protected - Verify token validity
 */
router.post(
  '/verify',
  authenticate,
  asyncHandler(authController.verifyToken)
);

export default router;
