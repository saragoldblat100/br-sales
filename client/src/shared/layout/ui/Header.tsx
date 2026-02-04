import type { RefObject } from 'react';
import { LogOut, User, ChevronDown } from 'lucide-react';
import styles from './Header.module.scss';

interface HeaderProps {
  userName?: string;
  userEmail?: string;
  roleLabel?: string;
  isMenuOpen: boolean;
  isLoggingOut: boolean;
  menuRef: RefObject<HTMLDivElement>;
  onToggleMenu: () => void;
  onLogout: () => void;
}

export function Header({
  userName,
  userEmail,
  roleLabel,
  isMenuOpen,
  isLoggingOut,
  menuRef,
  onToggleMenu,
  onLogout,
}: HeaderProps) {
  return (
    <header className={styles.header}>
      <div />
      <div className={styles.menuWrapper} ref={menuRef}>
        <button onClick={onToggleMenu} className={styles.menuButton}>
          <div className={styles.avatar}>
            <User className={styles.avatarIcon} />
          </div>
          <div className={styles.userInfo}>
            <p className={styles.userName}>{userName}</p>
            <p className={styles.userRole}>{roleLabel}</p>
          </div>
          <ChevronDown
            className={isMenuOpen ? styles.chevronOpen : styles.chevron}
          />
        </button>

        {isMenuOpen && (
          <div className={styles.dropdown}>
            <div className={styles.dropdownHeader}>
              <p className={styles.dropdownName}>{userName}</p>
              <p className={styles.dropdownEmail}>{userEmail}</p>
            </div>

            <button
              onClick={onLogout}
              disabled={isLoggingOut}
              className={styles.logoutButton}
            >
              {isLoggingOut ? (
                <span className={styles.spinner} />
              ) : (
                <LogOut className={styles.logoutIcon} />
              )}
              <span>התנתק</span>
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
