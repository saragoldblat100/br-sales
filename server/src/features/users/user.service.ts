import { User, IUser } from '@/features/auth/auth.model';
import { AppError } from '@/shared/errors';
import { activityService } from '@/features/activity';
import { createLogger } from '@/shared/utils';

const logger = createLogger('UserService');

interface ListUsersFilter {
  role?: string;
  isActive?: boolean;
}

interface CreateUserData {
  username: string;
  name: string;
  email: string;
  role: string;
  password: string;
}

interface UpdateUserData {
  username?: string;
  name?: string;
  email?: string;
  role?: string;
  isActive?: boolean;
}

export const userService = {
  async listUsers(filter: ListUsersFilter = {}) {
    const query: Record<string, unknown> = {};
    if (filter.role) query.role = filter.role;
    if (filter.isActive !== undefined) query.isActive = filter.isActive;

    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .lean();

    return users.map((u) => ({
      id: u._id.toString(),
      username: u.username,
      name: u.name,
      email: u.email,
      role: u.role,
      isActive: u.isActive,
      lastLogin: u.lastLogin,
      createdAt: u.createdAt,
    }));
  },

  async createUser(data: CreateUserData, adminId: string, adminUsername: string) {
    // Check uniqueness
    const existing = await User.findOne({
      $or: [
        { username: data.username.toLowerCase() },
        { email: data.email.toLowerCase() },
      ],
    });

    if (existing) {
      const field = existing.username === data.username.toLowerCase() ? 'שם משתמש' : 'אימייל';
      throw AppError.conflict(`${field} כבר קיים במערכת`);
    }

    const user = new User({
      username: data.username,
      name: data.name,
      email: data.email,
      role: data.role,
      password: data.password,
    });

    await user.save();
    logger.info('User created', { username: data.username, role: data.role, by: adminUsername });

    activityService.log(adminId, adminUsername, 'user_create', {
      createdUsername: data.username,
      role: data.role,
    });

    return {
      id: user._id.toString(),
      username: user.username,
      name: user.name,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
    };
  },

  async updateUser(userId: string, data: UpdateUserData, adminId: string, adminUsername: string) {
    const user = await User.findById(userId);
    if (!user) throw AppError.notFound('User');

    // Check username uniqueness if changing
    if (data.username) {
      const normalizedUsername = data.username.toLowerCase().trim();
      if (normalizedUsername !== user.username) {
        const existing = await User.findOne({ username: normalizedUsername, _id: { $ne: userId } });
        if (existing) throw AppError.conflict('׳©׳ ׳׳©׳×׳׳© ׳›׳‘׳¨ ׳§׳™׳™׳ ׳‘׳׳¢׳¨׳›׳×');
      }
    }

    // Check email uniqueness if changing
    if (data.email && data.email.toLowerCase() !== user.email) {
      const existing = await User.findOne({ email: data.email.toLowerCase(), _id: { $ne: userId } });
      if (existing) throw AppError.conflict('אימייל כבר קיים במערכת');
    }

    const changes: string[] = [];
    if (data.username) {
      const normalizedUsername = data.username.toLowerCase().trim();
      if (normalizedUsername !== user.username) {
        user.username = normalizedUsername;
        changes.push('username');
      }
    }
    if (data.name && data.name !== user.name) { user.name = data.name; changes.push('name'); }
    if (data.email && data.email !== user.email) { user.email = data.email; changes.push('email'); }
    if (data.role && data.role !== user.role) {
      changes.push(`role:${user.role}->${data.role}`);
      user.role = data.role as IUser['role'];
    }
    if (data.isActive !== undefined && data.isActive !== user.isActive) {
      user.isActive = data.isActive;
      changes.push(data.isActive ? 'activated' : 'deactivated');
    }

    if (changes.length === 0) return;

    await user.save();
    logger.info('User updated', { userId, changes, by: adminUsername });

    activityService.log(adminId, adminUsername, 'user_update', {
      updatedUsername: user.username,
      changes,
    });
  },

  async resetPassword(userId: string, newPassword: string, adminId: string, adminUsername: string) {
    const user = await User.findById(userId).select('+password');
    if (!user) throw AppError.notFound('User');

    user.password = newPassword;
    await user.save();

    logger.info('Password reset', { userId, username: user.username, by: adminUsername });

    activityService.log(adminId, adminUsername, 'user_password_reset', {
      resetUsername: user.username,
    });
  },

  async deleteUser(userId: string, adminId: string, adminUsername: string) {
    const user = await User.findById(userId);
    if (!user) throw AppError.notFound('User');

    // Don't allow deactivating yourself
    if (userId === adminId) {
      throw AppError.badRequest('לא ניתן להשבית את עצמך');
    }

    user.isActive = false;
    await user.save();

    logger.info('User deactivated', { userId, username: user.username, by: adminUsername });

    activityService.log(adminId, adminUsername, 'user_delete', {
      deactivatedUsername: user.username,
    });
  },
};
