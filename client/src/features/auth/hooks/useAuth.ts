import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProfile, useLogin, useLogout } from '../api';
import { getToken } from '@/shared/lib/api';
import type { LoginInput, UserProfile, UserRole } from '@bravo/shared';

/**
 * useAuth Hook
 *
 * Provides authentication state and actions:
 * - Current user profile
 * - Authentication status
 * - Login/logout functions
 * - Role checking utilities
 */
export function useAuth() {
  const navigate = useNavigate();

  // Profile query
  const {
    data: user,
    isLoading: isProfileLoading,
    error: profileError,
  } = useProfile();

  // Login mutation
  const loginMutation = useLogin();

  // Logout mutation
  const logoutMutation = useLogout();

  // Check if user is authenticated
  const isAuthenticated = useMemo(() => {
    return !!getToken() && !!user;
  }, [user]);

  // Check if still loading
  const isLoading = isProfileLoading && !!getToken();

  /**
   * Login function
   */
  const login = async (credentials: LoginInput): Promise<void> => {
    await loginMutation.mutateAsync(credentials);
    navigate('/');
  };

  /**
   * Logout function
   */
  const logout = async (): Promise<void> => {
    await logoutMutation.mutateAsync();
    navigate('/login');
  };

  /**
   * Check if user has specific role
   */
  const hasRole = (roles: UserRole | UserRole[]): boolean => {
    if (!user) return false;

    const roleArray = Array.isArray(roles) ? roles : [roles];
    return roleArray.includes(user.role);
  };

  /**
   * Check if user is admin
   */
  const isAdmin = useMemo(() => hasRole('admin'), [user]);

  /**
   * Check if user is manager
   */
  const isManager = useMemo(() => hasRole(['admin', 'manager']), [user]);

  return {
    // State
    user: user as UserProfile | undefined,
    isAuthenticated,
    isLoading,
    error: profileError,

    // Actions
    login,
    logout,
    isLoggingIn: loginMutation.isPending,
    isLoggingOut: logoutMutation.isPending,
    loginError: loginMutation.error,

    // Role helpers
    hasRole,
    isAdmin,
    isManager,
  };
}
