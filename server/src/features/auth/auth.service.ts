import jwt from 'jsonwebtoken';
import { env } from '@/config/env';
import { AppError } from '@/shared/errors';
import { User, IUser } from './auth.model';
import { LoginInput, LoginResponse, UserProfile } from '@bravo/shared';
import { createLogger } from '@/shared/utils';

const logger = createLogger('AuthService');

/**
 * Authentication Service
 *
 * Handles all authentication-related business logic:
 * - User login
 * - Token generation
 * - Password management
 */
export const authService = {
  /**
   * Authenticate user with username and password
   * Returns JWT token and user profile on success
   */
  async login(credentials: LoginInput): Promise<LoginResponse> {
    const { username, password } = credentials;

    logger.debug('Login attempt', { username });

    // Find user by username, including password field
    const user = await User.findOne({ username: username.toLowerCase() }).select(
      '+password'
    );

    if (!user) {
      logger.warn('Login failed - user not found', { username });
      throw AppError.unauthorized('Invalid credentials');
    }

    // Check if user is active
    if (!user.isActive) {
      logger.warn('Login failed - account inactive', { username });
      throw AppError.unauthorized('Account is not active');
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(password);

    if (!isPasswordValid) {
      logger.warn('Login failed - invalid password', { username });
      throw AppError.unauthorized('Invalid credentials');
    }

    // Update last login timestamp
    user.lastLogin = new Date();
    await user.save();

    // Generate JWT token
    const token = this.generateToken(user);

    logger.info('Login successful', { username, userId: user._id });

    return {
      token,
      user: {
        id: user._id.toString(),
        username: user.username,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    };
  },

  /**
   * Generate JWT token for a user
   */
  generateToken(user: IUser): string {
    const payload = {
      id: user._id.toString(),
      username: user.username,
      role: user.role,
    };

    return jwt.sign(payload, env.JWT_SECRET, {
      expiresIn: env.JWT_EXPIRES_IN as string,
    } as jwt.SignOptions);
  },

  /**
   * Get user profile by ID
   */
  async getProfile(userId: string): Promise<UserProfile> {
    const user = await User.findById(userId);

    if (!user) {
      throw AppError.notFound('User');
    }

    return {
      id: user._id.toString(),
      username: user.username,
      name: user.name,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
      lastLogin: user.lastLogin,
    };
  },

  /**
   * Change user password
   */
  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string
  ): Promise<void> {
    const user = await User.findById(userId).select('+password');

    if (!user) {
      throw AppError.notFound('User');
    }

    // Verify current password
    const isCurrentPasswordValid = await user.comparePassword(currentPassword);

    if (!isCurrentPasswordValid) {
      throw AppError.badRequest('Current password is incorrect');
    }

    // Update password (will be hashed by pre-save hook)
    user.password = newPassword;
    await user.save();

    logger.info('Password changed', { userId });
  },

  /**
   * Verify if a token is valid
   */
  verifyToken(token: string): { id: string; username: string } {
    try {
      const decoded = jwt.verify(token, env.JWT_SECRET) as {
        id: string;
        username: string;
      };
      return decoded;
    } catch {
      throw AppError.unauthorized('Invalid token');
    }
  },
};
