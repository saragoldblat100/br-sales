import { useAuth } from '@/features/auth';
import { SalesDashboardContainer } from '@/features/sales';
import { ManagerDashboard } from '@/features/manager';
import { DashboardPageView } from '../ui/DashboardPageView';

export function DashboardPageContainer() {
  const { user } = useAuth();

  // Route to appropriate dashboard based on role
  const getDashboardContent = () => {
    switch (user?.role) {
      case 'manager':
      case 'admin':
      case 'accountant':
      case 'logistics':
        return <ManagerDashboard />;
      case 'sales_agent':
      default:
        return <SalesDashboardContainer />;
    }
  };

  return <DashboardPageView content={getDashboardContent()} />;
}
