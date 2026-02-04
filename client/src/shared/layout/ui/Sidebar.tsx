import { NavLink } from 'react-router-dom';
import type { ElementType } from 'react';
import styles from './Sidebar.module.scss';
import logoImage from '@/assets/logo.png';
import { Settings } from 'lucide-react';

export interface SidebarNavItem {
  to: string;
  label: string;
  icon: ElementType;
  end?: boolean;
}

interface SidebarProps {
  items: SidebarNavItem[];
}

export function Sidebar({ items }: SidebarProps) {
  return (
    <aside className={styles.sidebar}>
      <div className={styles.logoRow}>
        <img src={logoImage} alt="Bravo" className={styles.logoImage} />
        <h1 className={styles.logoText}>Bravo Sales</h1>
      </div>

      <nav className={styles.nav}>
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              isActive ? styles.navItemActive : styles.navItem
            }
          >
            <item.icon className={styles.navIcon} />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className={styles.settings}>
        <NavLink
          to="/settings"
          className={({ isActive }) =>
            isActive ? styles.navItemActive : styles.navItem
          }
        >
          <Settings className={styles.navIcon} />
          <span>׳”׳’׳“׳¨׳•׳×</span>
        </NavLink>
      </div>
    </aside>
  );
}
