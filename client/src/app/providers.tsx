import { ReactNode } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { BrowserRouter } from 'react-router-dom';
import { queryClient } from './queryClient';

interface ProvidersProps {
  children: ReactNode;
}

/**
 * Application Providers
 *
 * Wraps the application with all necessary providers:
 * - QueryClientProvider: React Query for data fetching
 * - BrowserRouter: React Router for navigation
 * - Additional providers can be added here (Auth, Theme, etc.)
 */
export function Providers({ children }: ProvidersProps) {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        {children}
      </BrowserRouter>
      {/* React Query DevTools - only in development */}
      {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
    </QueryClientProvider>
  );
}
