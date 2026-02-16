import { api } from '@/shared/lib/api';

export interface UserRecord {
  id: string;
  username: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  lastLogin?: string;
  createdAt?: string;
}

export interface CreateUserInput {
  username: string;
  name: string;
  email: string;
  role: string;
  password: string;
}

export interface UpdateUserInput {
  username?: string;
  name?: string;
  email?: string;
  role?: string;
  isActive?: boolean;
}

export const usersApi = {
  async getUsers(filters?: { role?: string; isActive?: string }): Promise<UserRecord[]> {
    const params = new URLSearchParams();
    if (filters?.role) params.set('role', filters.role);
    if (filters?.isActive) params.set('isActive', filters.isActive);
    const query = params.toString();
    const response = await api.get(`/admin/users${query ? `?${query}` : ''}`);
    return response.data.data;
  },

  async createUser(data: CreateUserInput): Promise<UserRecord> {
    const response = await api.post('/admin/users', data);
    return response.data.data;
  },

  async updateUser(id: string, data: UpdateUserInput): Promise<void> {
    await api.patch(`/admin/users/${id}`, data);
  },

  async resetPassword(id: string, newPassword: string): Promise<void> {
    await api.patch(`/admin/users/${id}/password`, { newPassword });
  },

  async deleteUser(id: string): Promise<void> {
    await api.delete(`/admin/users/${id}`);
  },
};
