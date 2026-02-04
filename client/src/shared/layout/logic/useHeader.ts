import { useEffect, useMemo, useRef, useState } from 'react';
import type { UserRole } from '@bravo/shared';
import { useAuth } from '@/features/auth/hooks/useAuth';

const ROLE_LABELS: Record<UserRole, string> = {
  admin: 'מנהל מערכת',
  sales: 'סוכן מכירות',
  sales_agent: 'סוכן מכירות',
  manager: 'מנהל',
  accountant: 'חשב',
  logistics: 'לוגיסטיקה',
};

export function useHeader() {
  const { user, logout, isLoggingOut } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const roleLabel = useMemo(() => {
    if (!user?.role) return '';
    return ROLE_LABELS[user.role] || user.role;
  }, [user?.role]);

  const handleLogout = async () => {
    setIsMenuOpen(false);
    await logout();
  };

  return {
    userName: user?.name,
    userEmail: user?.email,
    roleLabel,
    isMenuOpen,
    isLoggingOut,
    menuRef,
    toggleMenu: () => setIsMenuOpen((prev) => !prev),
    handleLogout,
  };
}
