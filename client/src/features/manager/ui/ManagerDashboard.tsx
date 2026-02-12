import { useState } from 'react';
import { useAuth } from '@/features/auth';
import { CollectionModule } from '@/features/collection';
import { InventoryModule } from '@/features/inventory';
import { ActivityReportModule } from '@/features/activity';
import { ManagerSalesModule } from './ManagerSalesModule';
import { ManagerDashboardView, ComingSoonView, type ManagerModuleId, type ManagerModule } from './ManagerDashboardView';

const MODULES: ManagerModule[] = [
  {
    id: 'sales',
    title: 'מכירות',
    description: 'מסכי סוכנת מכירות',
    iconImage: '/icons/sales-chart.svg',
    iconBgColor: 'bg-orange-50',
  },
  {
    id: 'collection',
    title: 'גבייה',
    description: 'צפייה והעלאת נתוני גבייה',
    iconImage: '/icons/collection.svg',
    iconBgColor: 'bg-green-50',
  },
  {
    id: 'inventory',
    title: 'סחורות בארץ',
    description: 'העלאת קובץ מלאי בארץ',
    iconImage: '/icons/inventory.svg',
    iconBgColor: 'bg-blue-50',
  },
  {
    id: 'reports',
    title: 'דוחות סוכנת',
    description: 'דוחות פעילות',
    iconImage: '/icons/reports.svg',
    iconBgColor: 'bg-purple-50',
  },
  {
    id: 'items',
    title: 'עדכון פריטים',
    description: 'עדכון מחירים ופרטים',
    iconImage: '/icons/items-update.svg',
    iconBgColor: 'bg-indigo-50',
  },
];

export function ManagerDashboard() {
  const { user, logout } = useAuth();
  const [activeModule, setActiveModule] = useState<ManagerModuleId>(null);

  const handleBack = () => setActiveModule(null);

  if (activeModule === 'collection') {
    return (
      <CollectionModule
        user={{ name: user?.name, username: user?.username, role: user?.role }}
        onBack={handleBack}
        onLogout={logout}
        canUpload={true}
      />
    );
  }

  if (activeModule === 'inventory') {
    return (
      <InventoryModule
        user={{ name: user?.name, username: user?.username, role: user?.role }}
        onBack={handleBack}
        onLogout={logout}
        canUpload={true}
      />
    );
  }

  if (activeModule === 'items') {
    return <ComingSoonView title="עדכון פריטים" onBack={handleBack} />;
  }

  if (activeModule === 'reports') {
    return <ActivityReportModule onBack={handleBack} />;
  }

  if (activeModule === 'sales') {
    return <ManagerSalesModule onBack={handleBack} />;
  }

  // Filter modules by role - 'items' only for admin
  const visibleModules = MODULES.filter(
    (m) => m.id !== 'items' || user?.role === 'admin'
  );

  return (
    <ManagerDashboardView
      userName={user?.name || user?.username || ''}
      modules={visibleModules}
      onSelectModule={setActiveModule}
      onLogout={logout}
    />
  );
}
