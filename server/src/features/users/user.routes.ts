import { Router } from 'express';
import { userController } from './user.controller';
import { authenticate, authorize, validateBody } from '@/shared/middleware';
import { asyncHandler } from '@/shared/utils';
import { createUserSchema, updateUserSchema } from '@bravo/shared';
import { z } from 'zod';

const router = Router();

// All routes require admin role
router.use(authenticate, authorize(['admin']));

/**
 * GET / - List all users
 * Query: ?role=admin&isActive=true
 */
router.get('/', asyncHandler(userController.listUsers));

/**
 * POST / - Create a new user
 */
router.post(
  '/',
  validateBody(createUserSchema),
  asyncHandler(userController.createUser)
);

/**
 * PATCH /:id - Update user details
 */
router.patch(
  '/:id',
  validateBody(updateUserSchema.partial()),
  asyncHandler(userController.updateUser)
);

/**
 * PATCH /:id/password - Reset user password
 */
router.patch(
  '/:id/password',
  validateBody(z.object({ newPassword: z.string().min(6) })),
  asyncHandler(userController.resetPassword)
);

/**
 * DELETE /:id - Deactivate user (soft delete)
 */
router.delete('/:id', asyncHandler(userController.deleteUser));

export default router;
