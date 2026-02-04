import { ItemsPageView } from '../ui/ItemsPageView';
import { useItemsPage } from '../logic/useItemsPage';

export function ItemsPageContainer() {
  const { viewMode, setViewMode } = useItemsPage();

  return <ItemsPageView viewMode={viewMode} onViewModeChange={setViewMode} />;
}
