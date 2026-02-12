import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useAutoLogout } from '@/features/auth/hooks/useAutoLogout';

// Pages
import { LoginPage } from '@/pages/LoginPage';
import { NotFoundPage } from '@/pages/NotFoundPage';
import { LoadingScreen } from '@/app/ui/LoadingScreen';

// Dashboard (routes to Manager or Sales based on role)
import { DashboardPageContainer } from '@/pages/containers/DashboardPageContainer';

/**
 * Protected Route Component
 * Redirects to login if user is not authenticated
 * Auto-logs out after 30 minutes of inactivity
 */
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();

  // Auto-logout after 30 minutes of inactivity
  useAutoLogout();

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
            <DashboardPageContainer />
          </ProtectedRoute>
        }
      />

      {/* 404 */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
