import { useState } from 'react';
import { useAuth } from '@/features/auth';
import { CollectionModule } from '@/features/collection';
import { InventoryModule } from '@/features/inventory';
import { ActivityReportModule } from '@/features/activity';
import { ManagerSalesModule } from './ManagerSalesModule';
import { UsersModule } from '@/features/users';
import { PricingModule } from '@/features/pricing';
import { OrdersModule } from '@/features/orders';
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
  {
    id: 'pricing',
    title: 'מחשבון תמחור',
    description: 'חישוב מחיר עם שרשרת תמחור',
    iconImage: '/icons/calculator.svg',
    iconBgColor: 'bg-violet-50',
  },
  {
    id: 'users',
    title: 'ניהול משתמשים',
    description: 'יצירה, עריכה והשבתת משתמשים',
    iconImage: '/icons/users.svg',
    iconBgColor: 'bg-cyan-50',
  },
  {
    id: 'orders',
    title: 'ניהול הזמנות',
    description: 'צפייה בהזמנות שנשלחו וטיוטות',
    iconImage: '/icons/orders.svg',
    iconBgColor: 'bg-rose-50',
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

  if (activeModule === 'users') {
    return <UsersModule onBack={handleBack} />;
  }

  if (activeModule === 'pricing') {
    return <PricingModule onBack={handleBack} />;
  }

  if (activeModule === 'orders') {
    return <OrdersModule onBack={handleBack} />;
  }

  // Filter modules by role
  const visibleModules = MODULES.filter((m) => {
    // 'items' and 'users' only for admin
    if (m.id === 'items' || m.id === 'users') return user?.role === 'admin';
    // 'pricing' for admin and manager
    if (m.id === 'pricing') return user?.role === 'admin' || user?.role === 'manager';
    // 'orders' for admin, manager, accountant, sales_agent
    if (m.id === 'orders') return ['admin', 'manager', 'accountant', 'sales_agent'].includes(user?.role || '');
    return true;
  });

  return (
    <ManagerDashboardView
      userName={user?.name || user?.username || ''}
      modules={visibleModules}
      onSelectModule={setActiveModule}
      onLogout={logout}
    />
  );
}
