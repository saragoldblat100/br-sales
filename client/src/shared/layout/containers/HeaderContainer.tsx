import { Header } from '../ui/Header';
import { useHeader } from '../logic/useHeader';

export function HeaderContainer() {
  const {
    userName,
    userEmail,
    roleLabel,
    isMenuOpen,
    isLoggingOut,
    menuRef,
    toggleMenu,
    handleLogout,
  } = useHeader();

  return (
    <Header
      userName={userName}
      userEmail={userEmail}
      roleLabel={roleLabel}
      isMenuOpen={isMenuOpen}
      isLoggingOut={isLoggingOut}
      menuRef={menuRef}
      onToggleMenu={toggleMenu}
      onLogout={handleLogout}
    />
  );
}
