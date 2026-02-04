import { Sidebar } from '../ui/Sidebar';
import { useSidebar } from '../logic/useSidebar';

export function SidebarContainer() {
  const { items } = useSidebar();
  return <Sidebar items={items} />;
}
