import { Navigate } from 'react-router-dom';
import { LoginForm } from '@/features/auth';
import { LoginPageLoading, LoginPageView } from '../ui/LoginPageView';
import { useLoginPage } from '../logic/useLoginPage';

export function LoginPageContainer() {
  const { isAuthenticated, isLoading, currentYear } = useLoginPage();

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  if (isLoading) {
    return <LoginPageLoading label="Loading..." />;
  }

  return <LoginPageView loginForm={<LoginForm />} currentYear={currentYear} />;
}
