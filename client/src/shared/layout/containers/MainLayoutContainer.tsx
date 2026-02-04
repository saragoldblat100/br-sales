import { Outlet } from 'react-router-dom';
import { MainLayout } from '../ui/MainLayout';
import { SidebarContainer } from './SidebarContainer';
import { HeaderContainer } from './HeaderContainer';

export function MainLayoutContainer() {
  return (
    <MainLayout
      sidebar={<SidebarContainer />}
      header={<HeaderContainer />}
      content={<Outlet />}
    />
  );
}
