import { useMemo } from 'react';
import type { UserProfile } from '@bravo/shared';
import type { SalesMenuModule } from '../ui/SalesMainMenuView';

export function useSalesMainMenu(user: UserProfile) {
  const userDisplayName = useMemo(() => {
    if (/[\u0590-\u05FF]/.test(user.name)) return user.name;
    return user.name;
  }, [user.name]);

  const modules: SalesMenuModule[] = [
    {
      id: 'sales',
      title: 'מכירות',
      description: 'בחירת לקוח והזמנות',
      iconImage: '/icons/sales-chart.svg',
      iconBgColor: 'bg-orange-50',
    },
    {
      id: 'collection',
      title: 'גבייה',
      description: 'ניהול גבייה מלקוחות',
      iconImage: '/icons/collection.svg',
      iconBgColor: 'bg-green-50',
    },
    {
      id: 'inventory',
      title: 'סחורות בארץ',
      description: 'מלאי בארץ',
      iconImage: '/icons/inventory.svg',
      iconBgColor: 'bg-blue-50',
    },
  ];

  return {
    userDisplayName,
    modules,
    currentYear: new Date().getFullYear(),
  };
}
