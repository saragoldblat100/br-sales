import { useState } from 'react';
import { Wallet, Package, FileText, Warehouse, ShoppingCart } from 'lucide-react';
import { useAuth } from '@/features/auth';
import { CollectionModule } from '@/features/collection';
import { InventoryModule } from '@/features/inventory';
import { ManagerDashboardView, ComingSoonView, type ManagerModuleId, type ManagerModule } from './ManagerDashboardView';

const MODULES: ManagerModule[] = [
  {
    id: 'collection',
    title: 'מצב גבייה',
    description: 'צפייה והעלאת נתוני גבייה',
    icon: Wallet,
    gradient: 'from-amber-500 to-orange-600',
  },
  {
    id: 'inventory',
    title: 'עדכון מלאי',
    description: 'העלאת קובץ מלאי בארץ',
    icon: Warehouse,
    gradient: 'from-emerald-500 to-teal-600',
  },
  {
    id: 'items',
    title: 'עדכון פריטים',
    description: 'עדכון מחירים ופרטים',
    icon: Package,
    gradient: 'from-blue-500 to-indigo-600',
  },
  {
    id: 'reports',
    title: 'דוחות סוכנת',
    description: 'דוחות פעילות',
    icon: FileText,
    gradient: 'from-purple-500 to-violet-600',
  },
  {
    id: 'sales',
    title: 'מכירות',
    description: 'מסכי סוכנת מכירות',
    icon: ShoppingCart,
    gradient: 'from-red-500 to-rose-600',
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
    return <ComingSoonView title="עדכון פריטים" icon={Package} onBack={handleBack} />;
  }

  if (activeModule === 'reports') {
    return <ComingSoonView title="דוחות סוכנת" icon={FileText} onBack={handleBack} />;
  }

  if (activeModule === 'sales') {
    return <ComingSoonView title="מכירות" icon={ShoppingCart} onBack={handleBack} />;
  }

  return (
    <ManagerDashboardView
      userName={user?.name || user?.username || ''}
      modules={MODULES}
      onSelectModule={setActiveModule}
      onLogout={logout}
    />
  );
}
