import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { authApi } from './auth.api';
import type { LoginInput, LoginResponse, UserProfile } from '@bravo/shared';
import { getToken, removeToken } from '@/shared/lib/api';

/**
 * Query Keys
 * Centralized query key management for auth
 */
export const authKeys = {
  all: ['auth'] as const,
  profile: () => [...authKeys.all, 'profile'] as const,
};

/**
 * useProfile Hook
 * Fetches and caches current user profile
 */
export function useProfile() {
  const token = getToken();

  return useQuery<UserProfile>({
    queryKey: authKeys.profile(),
    queryFn: () => authApi.getProfile(),
    // Only fetch if token exists
    enabled: !!token,
    // Keep profile data fresh
    staleTime: 5 * 60 * 1000, // 5 minutes
    // Retry once on failure
    retry: 1,
  });
}

/**
 * useLogin Mutation
 * Handles user login
 */
export function useLogin() {
  const queryClient = useQueryClient();

  return useMutation<LoginResponse, Error, LoginInput>({
    mutationFn: (credentials) => authApi.login(credentials),
    onSuccess: () => {
      // Get the full user profile from localStorage (includes isActive)
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        queryClient.setQueryData(authKeys.profile(), JSON.parse(storedUser));
      }
    },
  });
}

/**
 * useLogout Mutation
 * Handles user logout
 */
export function useLogout() {
  const queryClient = useQueryClient();

  return useMutation<void, Error>({
    mutationFn: () => authApi.logout(),
    onSuccess: () => {
      // Clear all cached data
      queryClient.clear();
    },
    onError: () => {
      // Even on error, clear local data
      removeToken();
      queryClient.clear();
    },
  });
}

/**
 * useChangePassword Mutation
 * Handles password change
 */
export function useChangePassword() {
  return useMutation<void, Error, { currentPassword: string; newPassword: string }>({
    mutationFn: ({ currentPassword, newPassword }) =>
      authApi.changePassword(currentPassword, newPassword),
  });
}
