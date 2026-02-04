import { SalesDashboardContainer } from '@/features/sales';
import { DashboardPageView } from '../ui/DashboardPageView';

export function DashboardPageContainer() {
  return <DashboardPageView content={<SalesDashboardContainer />} />;
}
