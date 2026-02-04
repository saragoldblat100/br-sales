import { api } from '@/shared/lib/api';

/**
 * Cart item type
 */
export interface CartItem {
  itemId: string;
  itemCode: string;
  nameHe?: string;
  englishDescription?: string;
  imageUrl?: string;
  qtyPerCarton: number;
  cartons: number;
  pricePerCarton: number;
  pricePerUnit: number;
  currency: 'ILS' | 'USD';
  totalPrice: number;
  boxCBM?: number;
  priceSource?: string;
}

/**
 * Order line item (for API)
 */
export interface OrderLine {
  itemId: string;
  itemCode: string;
  description: string;
  quantity: number;
  cartons: number;
  pricePerUnit: number;
  pricePerCarton: number;
  totalPrice: number;
  currency: string;
  cbm: number;
}

/**
 * Create order request
 */
export interface CreateOrderRequest {
  customerId: string;
  customerCode: string;
  customerName: string;
  lines: OrderLine[];
  status: 'draft' | 'quote' | 'order';
  notes?: string;
}

/**
 * Create order response
 */
export interface CreateOrderResponse {
  success: boolean;
  order: {
    _id: string;
    orderNumber?: string;
    status: string;
    totalCBM: number;
    totalAmount: number;
    createdAt: string;
  };
}

/**
 * Create a new order/quote
 */
export async function createOrder(data: CreateOrderRequest): Promise<CreateOrderResponse> {
  const response = await api.post('/sales/orders', data);
  return response.data;
}

/**
 * Draft order response
 */
export interface DraftOrderResponse {
  success: boolean;
  data: {
    _id: string;
    customerId: string;
    customerCode: string;
    customerName: string;
    lines: OrderLine[];
    notes?: string;
    totalCBM: number;
    totalAmountILS: number;
    totalAmountUSD: number;
  } | null;
}

/**
 * Get draft order for a customer
 */
export async function getDraftOrder(customerId: string): Promise<DraftOrderResponse> {
  const response = await api.get(`/sales/orders/draft/${customerId}`);
  return response.data;
}

/**
 * Update currency rate
 */
export async function updateCurrencyRate(): Promise<{ success: boolean; rate: number }> {
  const response = await api.post('/currency/update', {});
  return response.data;
}
