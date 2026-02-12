import { Request, Response } from 'express';
import { authService } from './auth.service';
import { LoginInput, ChangePasswordInput } from '@bravo/shared';
import { AuthenticatedRequest } from '@/shared/middleware';
import { activityService } from '@/features/activity';

/**
 * Authentication Controller
 *
 * Handles HTTP layer for authentication endpoints.
 * Delegates business logic to authService.
 */
export const authController = {
  /**
   * POST /auth/login
   * Authenticate user and return JWT token
   */
  async login(req: Request, res: Response): Promise<void> {
    const credentials = req.body as LoginInput;
    const result = await authService.login(credentials);

    res.json({
      success: true,
      data: result,
      message: 'Login successful',
    });
  },

  /**
   * GET /auth/me
   * Get current user profile
   */
  async getProfile(req: AuthenticatedRequest, res: Response): Promise<void> {
    const userId = req.user!.id;
    const profile = await authService.getProfile(userId);

    res.json({
      success: true,
      data: profile,
    });
  },

  /**
   * POST /auth/change-password
   * Change current user's password
   */
  async changePassword(req: AuthenticatedRequest, res: Response): Promise<void> {
    const userId = req.user!.id;
    const { currentPassword, newPassword } = req.body as ChangePasswordInput;

    await authService.changePassword(userId, currentPassword, newPassword);

    res.json({
      success: true,
      message: 'Password changed successfully',
    });
  },

  /**
   * POST /auth/logout
   * Logout current user (client-side token removal)
   */
  async logout(req: AuthenticatedRequest, res: Response): Promise<void> {
    // Log logout activity if user is authenticated
    if (req.user) {
      activityService.log(req.user.id, req.user.username, 'logout');
    }

    res.json({
      success: true,
      message: 'Logged out successfully',
    });
  },

  /**
   * POST /auth/verify
   * Verify if current token is valid
   */
  async verifyToken(req: AuthenticatedRequest, res: Response): Promise<void> {
    // If we reach here, authentication middleware passed
    res.json({
      success: true,
      data: {
        valid: true,
        user: req.user,
      },
    });
  },
};
