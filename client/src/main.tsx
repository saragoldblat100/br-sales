import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { ErrorBoundary } from '@/app/ErrorBoundary';
import { Providers } from '@/app/providers';
import { AppRouter } from '@/app/router';
import './index.css';

/**
 * Application Entry Point
 *
 * Renders the application with all providers:
 * - React Query for data fetching
 * - React Router for navigation
 * - Additional providers as needed
 */
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <Providers>
        <AppRouter />
      </Providers>
    </ErrorBoundary>
  </StrictMode>
);
