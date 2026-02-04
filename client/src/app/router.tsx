import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '@/features/auth/hooks/useAuth';

// Pages
import { LoginPage } from '@/pages/LoginPage';
import { NotFoundPage } from '@/pages/NotFoundPage';
import { LoadingScreen } from '@/app/ui/LoadingScreen';

// Sales Dashboard
import { SalesDashboardContainer } from '@/features/sales';

/**
 * Protected Route Component
 * Redirects to login if user is not authenticated
 */
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

/**
 * Application Router
 *
 * Routes for Sales Agent application:
 * - Public routes (login)
 * - Protected routes (sales dashboard with main menu)
 */
export function AppRouter() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={<LoginPage />} />

      {/* Protected Route - Sales Dashboard */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <SalesDashboardContainer />
          </ProtectedRoute>
        }
      />

      {/* 404 */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
