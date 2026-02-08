import { api, setToken, removeToken } from '@/shared/lib/api';
import type { LoginInput, LoginResponse, UserProfile } from '@bravo/shared';

/**
 * Authentication API
 * Handles all auth-related API calls
 * Compatible with supplier-price-form server
 */
export const authApi = {
  /**
   * Login with username and password
   */
  async login(credentials: LoginInput): Promise<LoginResponse> {
    try {
      const response = await api.post('/auth/login', credentials);

      const { token, user: userData } = response.data.data;
      setToken(token);

      // Build user profile from server response
      const user: UserProfile = {
        id: userData.id,
        username: userData.username,
        name: userData.name,
        email: userData.email,
        role: userData.role as 'admin' | 'sales' | 'sales_agent' | 'manager' | 'accountant' | 'logistics',
        isActive: true,
      };
      localStorage.setItem('user', JSON.stringify(user));

      return { token, user: { id: userData.id, username: userData.username, name: userData.name, email: userData.email, role: user.role } };
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  },

  /**
   * Logout current user
   */
  async logout(): Promise<void> {
    removeToken();
    localStorage.removeItem('user');
  },

  /**
   * Get current user profile from localStorage
   */
  async getProfile(): Promise<UserProfile> {
    const stored = localStorage.getItem('user');
    if (stored) {
      return JSON.parse(stored);
    }
    throw new Error('No user profile');
  },

  /**
   * Change password - not implemented
   */
  async changePassword(
    _currentPassword: string,
    _newPassword: string
  ): Promise<void> {
    throw new Error('Change password not supported');
  },

  /**
   * Verify if token is still valid
   */
  async verifyToken(): Promise<boolean> {
    try {
      await api.post('/auth/verify');
      return true;
    } catch {
      return false;
    }
  },
};
