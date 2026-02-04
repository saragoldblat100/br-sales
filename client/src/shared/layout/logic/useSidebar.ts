import { LayoutDashboard, Users, Package, ShoppingCart } from 'lucide-react';
import type { SidebarNavItem } from '../ui/Sidebar';

export function useSidebar(): { items: SidebarNavItem[] } {
  const items: SidebarNavItem[] = [
    { to: '/', label: 'דשבורד', icon: LayoutDashboard, end: true },
    { to: '/customers', label: 'לקוחות', icon: Users },
    { to: '/items', label: 'פריטים', icon: Package },
    { to: '/orders', label: 'הזמנות', icon: ShoppingCart },
  ];

  return { items };
}
