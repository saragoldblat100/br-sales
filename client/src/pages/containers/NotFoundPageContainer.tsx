import { NotFoundPageView } from '../ui/NotFoundPageView';

export function NotFoundPageContainer() {
  return <NotFoundPageView onGoBack={() => window.history.back()} />;
}
