import { CollectionModule } from '@/features/collection';
import { useAuth } from '@/features/auth';

interface CollectionModuleViewProps {
  userName: string;
  onBack: () => void;
  onLogout: () => void;
}

export function CollectionModuleView({ userName, onBack, onLogout }: CollectionModuleViewProps) {
  const { user } = useAuth();

  // Manager and Accountant can upload files
  const canUpload = user?.role === 'manager' || user?.role === 'accountant' || user?.role === 'admin';

  return (
    <CollectionModule
      user={{ name: userName, username: user?.username, role: user?.role }}
      onBack={onBack}
      onLogout={onLogout}
      canUpload={canUpload}
    />
  );
}
