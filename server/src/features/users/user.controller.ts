import { Response } from 'express';
import { AuthenticatedRequest } from '@/shared/middleware';
import { userService } from './user.service';

export const userController = {
  async listUsers(req: AuthenticatedRequest, res: Response) {
    const { role, isActive } = req.query;
    const filter: { role?: string; isActive?: boolean } = {};
    if (role) filter.role = role as string;
    if (isActive !== undefined) filter.isActive = isActive === 'true';

    const users = await userService.listUsers(filter);
    res.json({ success: true, data: users });
  },

  async createUser(req: AuthenticatedRequest, res: Response) {
    const { username, name, email, role, password } = req.body;
    const user = await userService.createUser(
      { username, name, email, role, password },
      req.user!.id,
      req.user!.username
    );
    res.status(201).json({ success: true, data: user });
  },

  async updateUser(req: AuthenticatedRequest, res: Response) {
    const { id } = req.params;
    const { username, name, email, role, isActive } = req.body;
    await userService.updateUser(
      id,
      { username, name, email, role, isActive },
      req.user!.id,
      req.user!.username
    );
    res.json({ success: true, message: 'משתמש עודכן בהצלחה' });
  },

  async resetPassword(req: AuthenticatedRequest, res: Response) {
    const { id } = req.params;
    const { newPassword } = req.body;
    await userService.resetPassword(id, newPassword, req.user!.id, req.user!.username);
    res.json({ success: true, message: 'סיסמה אופסה בהצלחה' });
  },

  async deleteUser(req: AuthenticatedRequest, res: Response) {
    const { id } = req.params;
    await userService.deleteUser(id, req.user!.id, req.user!.username);
    res.json({ success: true, message: 'משתמש הושבת בהצלחה' });
  },
};
