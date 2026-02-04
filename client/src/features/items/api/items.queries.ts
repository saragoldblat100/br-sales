import { useQuery, useMutation } from '@tanstack/react-query';
import {
  getCategories,
  searchItemsByCode,
  getItemsByCategory,
  getRecentItems,
  getItemsWithImages,
  calculateItemPrice,
  type CalculatePriceParams,
} from './items.api';

/**
 * Query keys for items data
 */
export const itemKeys = {
  all: ['items'] as const,
  categories: () => [...itemKeys.all, 'categories'] as const,
  search: (query: string, customerCode?: string) =>
    [...itemKeys.all, 'search', query, customerCode] as const,
  byCategory: (categoryId: string, customerCode?: string) =>
    [...itemKeys.all, 'category', categoryId, customerCode] as const,
  recent: (customerCode?: string) => [...itemKeys.all, 'recent', customerCode] as const,
  withImages: (customerCode?: string, categoryId?: string) =>
    [...itemKeys.all, 'withImages', customerCode, categoryId] as const,
  pricing: (itemId: string, customerCode: string) =>
    [...itemKeys.all, 'pricing', itemId, customerCode] as const,
};

/**
 * Hook to get all categories
 */
export function useCategories() {
  return useQuery({
    queryKey: itemKeys.categories(),
    queryFn: getCategories,
    staleTime: 10 * 60 * 1000, // 10 minutes - categories rarely change
  });
}

/**
 * Hook to search items by code or name
 */
export function useSearchItems(query: string, customerCode?: string) {
  return useQuery({
    queryKey: itemKeys.search(query, customerCode),
    queryFn: () => searchItemsByCode(query, customerCode),
    enabled: query.length >= 2,
    staleTime: 30 * 1000, // 30 seconds
  });
}

/**
 * Hook to get items by category
 */
export function useItemsByCategory(categoryId: string | null, customerCode?: string) {
  return useQuery({
    queryKey: itemKeys.byCategory(categoryId || '', customerCode),
    queryFn: () => getItemsByCategory(categoryId!, customerCode),
    enabled: !!categoryId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

/**
 * Hook to get recently sold items
 */
export function useRecentItems(customerCode?: string, enabled = true) {
  return useQuery({
    queryKey: itemKeys.recent(customerCode),
    queryFn: () => getRecentItems(customerCode),
    enabled,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook to get items with images
 */
export function useItemsWithImages(
  customerCode?: string,
  categoryId?: string,
  enabled = true
) {
  return useQuery({
    queryKey: itemKeys.withImages(customerCode, categoryId),
    queryFn: () => getItemsWithImages(customerCode, categoryId),
    enabled,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook to calculate item price
 */
export function useCalculatePrice() {
  return useMutation({
    mutationFn: (params: CalculatePriceParams) => calculateItemPrice(params),
  });
}
