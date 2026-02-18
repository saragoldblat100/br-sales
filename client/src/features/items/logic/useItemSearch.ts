import { useEffect, useMemo, useState } from 'react';
import { Search, Star, Clock, Image, Grid3X3 } from 'lucide-react';
import type { CustomerWithSpecialPrices, SalesItem } from '@bravo/shared';
import {
  useCategories,
  useSearchItems,
  useItemsByCategory,
  useRecentItems,
  useItemsWithImages,
} from '../api';
import type { SearchModeOption } from '../ui/ItemSearchView';

export type SearchMode = 'special' | 'code' | 'category' | 'recent' | 'images';

export function useItemSearch(customer: CustomerWithSpecialPrices) {
  const [searchMode, setSearchMode] = useState<SearchMode>('special');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<SalesItem | null>(null);

  const customerCode = customer.customer.customerCode;

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const { data: categoriesData } = useCategories();
  const { data: searchResults, isLoading: isSearching, error: searchError } = useSearchItems(
    debouncedQuery,
    customerCode
  );
  const { data: categoryItems, isLoading: isLoadingCategory, error: categoryError } = useItemsByCategory(
    selectedCategoryId,
    customerCode
  );
  const { data: recentItems, isLoading: isLoadingRecent, error: recentError } = useRecentItems(
    customerCode,
    searchMode === 'recent'
  );
  const { data: imageItems, isLoading: isLoadingImages, error: imagesError } = useItemsWithImages(
    customerCode,
    undefined,
    searchMode === 'images'
  );

  const searchModes: SearchModeOption[] = [
    {
      id: 'special',
      label: 'מחירים מיוחדים',
      icon: Star,
      count: customer.itemsWithSpecialPrices.length,
    },
    { id: 'code', label: 'חיפוש לפי קוד', icon: Search },
    { id: 'category', label: 'לפי קטגוריה', icon: Grid3X3 },
    { id: 'recent', label: 'נמכרו לאחרונה', icon: Clock },
    { id: 'images', label: 'עם תמונות', icon: Image },
  ];

  // Convert customer special prices to SalesItem format
  const specialPriceItems: SalesItem[] = customer.itemsWithSpecialPrices.map((item) => ({
    _id: item._id,
    itemCode: item.itemCode,
    englishDescription: item.englishDescription,
    nameHe: item.nameHe,
    imageUrl: item.imageUrl,
    qtyPerCarton: item.qtyPerCarton,
    boxCBM: item.boxCBM,
    cartonHeight: item.cartonHeight,
    cartonLength: item.cartonLength,
    cartonWidth: item.cartonWidth,
    categoryId: item.categoryId,
    hasSpecialPrice: true,
    specialPrice: {
      price: item.specialPrice,
      currency: item.specialPriceCurrency,
    },
    lastSalesOrderPrice: item.lastSalesOrderPrice,
    lastSalesOrderCurrency: item.lastSalesOrderCurrency,
    lastSalesOrderDate: item.lastSalesOrderDate,
    lastSalesOrderNumber: item.lastSalesOrderNumber,
  }));

  const displayedItems = useMemo((): SalesItem[] => {
    switch (searchMode) {
      case 'special':
        return specialPriceItems;
      case 'code':
        return searchResults?.items || [];
      case 'category':
        return categoryItems?.items || [];
      case 'recent':
        return recentItems?.items || [];
      case 'images':
        return imageItems?.items || [];
      default:
        return [];
    }
  }, [searchMode, specialPriceItems, searchResults, categoryItems, recentItems, imageItems]);

  const isLoading = isSearching || isLoadingCategory || isLoadingRecent || isLoadingImages;

  const emptyStateMessage = useMemo(() => {
    if (searchMode === 'special') {
      return 'אין פריטים עם מחיר מיוחד ללקוח זה';
    }
    if (searchMode === 'code' && debouncedQuery.length < 2) {
      return 'הזן לפחות 2 תווים לחיפוש';
    }
    if (searchMode === 'category' && !selectedCategoryId) {
      return 'בחר קטגוריה להצגת פריטים';
    }
    return 'לא נמצאו פריטים';
  }, [searchMode, debouncedQuery.length, selectedCategoryId]);

  const errorMessage = useMemo(() => {
    if (searchMode === 'code' && searchError) return 'שגיאה בטעינת תוצאות החיפוש';
    if (searchMode === 'category' && categoryError) return 'שגיאה בטעינת פריטים בקטגוריה';
    if (searchMode === 'recent' && recentError) return 'שגיאה בטעינת פריטים שנמכרו לאחרונה';
    if (searchMode === 'images' && imagesError) return 'שגיאה בטעינת פריטים עם תמונות';
    return undefined;
  }, [searchMode, searchError, categoryError, recentError, imagesError]);

  return {
    searchMode,
    setSearchMode: (mode: SearchMode) => {
      setSearchMode(mode);
      setSearchQuery('');
      setSelectedCategoryId(null);
    },
    searchQuery,
    setSearchQuery,
    categories: categoriesData?.categories ?? [],
    selectedCategoryId,
    setSelectedCategoryId,
    displayedItems,
    isLoading,
    emptyStateMessage,
    selectedItem,
    setSelectedItem,
    searchModes,
    showSearchInput: searchMode === 'code',
    errorMessage,
  };
}
