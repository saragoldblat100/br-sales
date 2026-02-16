import type { UserProfile } from '@bravo/shared';
import { SalesMainMenuView } from '../ui/SalesMainMenuView';
import { useSalesMainMenu } from '../logic/useSalesMainMenu';
import type { SalesModuleId } from '../ui/SalesMainMenuView';

interface SalesMainMenuContainerProps {
  user: UserProfile;
  onSelectModule: (module: SalesModuleId) => void;
  onLogout: () => void;
}

export function SalesMainMenuContainer({
  user,
  onSelectModule,
  onLogout,
}: SalesMainMenuContainerProps) {
  const { userDisplayName, modules, currentYear } = useSalesMainMenu(user);

  return (
    <SalesMainMenuView
      userDisplayName={userDisplayName}
      modules={modules}
      onSelectModule={onSelectModule}
      onLogout={onLogout}
      currentYear={currentYear}
    />
  );
}
