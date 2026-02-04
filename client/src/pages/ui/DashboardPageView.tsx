import type { ReactNode } from 'react';

interface DashboardPageViewProps {
  content: ReactNode;
}

export function DashboardPageView({ content }: DashboardPageViewProps) {
  return <>{content}</>;
}
