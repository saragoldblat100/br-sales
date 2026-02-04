import { useState } from 'react';

export function useItemsPage() {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  return {
    viewMode,
    setViewMode,
  };
}
