import { useMemo } from 'react';
import { useAuth } from '@/features/auth/hooks/useAuth';

export function useLoginPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const currentYear = useMemo(() => new Date().getFullYear(), []);

  return {
    isAuthenticated,
    isLoading,
    currentYear,
  };
}
