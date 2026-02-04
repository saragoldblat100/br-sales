import { QueryClient } from '@tanstack/react-query';

/**
 * React Query Client Configuration
 *
 * This client is used throughout the application for data fetching.
 * Configuration options:
 * - staleTime: How long data is considered fresh (no refetch)
 * - gcTime: How long inactive data stays in cache (garbage collection)
 * - retry: Number of retry attempts on failure
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Data is considered fresh for 30 seconds
      staleTime: 30 * 1000,

      // Keep inactive data in cache for 5 minutes
      gcTime: 5 * 60 * 1000,

      // Retry failed requests 3 times
      retry: 3,

      // Don't refetch when window regains focus in development
      refetchOnWindowFocus: import.meta.env.PROD,

      // Refetch on reconnect
      refetchOnReconnect: true,
    },
    mutations: {
      // Retry mutations once
      retry: 1,
    },
  },
});
