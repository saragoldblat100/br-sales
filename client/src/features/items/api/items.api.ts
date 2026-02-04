import { api } from '@/shared/lib/api';
import type { SalesItem, ItemPricing } from '@bravo/shared';

/**
 * Items API endpoints for sales
 */

/**
 * Category response type
 */
export interface Category {
  _id: string;
  name: string;
  nameEn?: string;
  nameHe?: string;
  icon?: string;
  order?: number;
}

/**
 * Items response type
 */
export interface ItemsResponse {
  items: SalesItem[];
}

/**
 * Get all active categories
 */
export async function getCategories(): Promise<{ categories: Category[] }> {
  const response = await api.get('/sales/categories');
  return response.data;
}

/**
 * Search items by code or name
 */
export async function searchItemsByCode(
  query: string,
  customerCode?: string
): Promise<ItemsResponse> {
  const response = await api.get('/sales/items/search', {
    params: { q: query, customerCode },
  });
  return response.data;
}

/**
 * Get items by category
 */
export async function getItemsByCategory(
  categoryId: string,
  customerCode?: string
): Promise<ItemsResponse> {
  const response = await api.get(`/sales/items/category/${categoryId}`, {
    params: { customerCode },
  });
  return response.data;
}

/**
 * Get recently sold items
 */
export async function getRecentItems(customerCode?: string): Promise<ItemsResponse> {
  const response = await api.get('/sales/items/recent', {
    params: { customerCode },
  });
  return response.data;
}

/**
 * Get items with images
 */
export async function getItemsWithImages(
  customerCode?: string,
  categoryId?: string
): Promise<ItemsResponse> {
  const response = await api.get('/sales/items/with-images', {
    params: { customerCode, categoryId },
  });
  return response.data;
}

/**
 * Calculate item price for a specific customer
 */
export interface CalculatePriceParams {
  itemId: string;
  customerCode: string;
  quantity: number;
  portOfOrigin?: string;
  containerSizeCBM?: number;
}

export interface CalculatePriceResponse {
  success: boolean;
  item: SalesItem;
  pricing: ItemPricing;
}

export async function calculateItemPrice(params: CalculatePriceParams): Promise<CalculatePriceResponse> {
  const response = await api.post(`/sales/items/${params.itemId}/calculate-price`, {
    customerCode: params.customerCode,
    quantity: params.quantity,
    portOfOrigin: params.portOfOrigin || 'Shenzhen Yantian',
    containerSizeCBM: params.containerSizeCBM || 68,
  });
  return response.data;
}
