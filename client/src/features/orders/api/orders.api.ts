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
 * Order item (for display, from OrderLog or Order)
 */
export interface OrderItem {
  _id: string;
  orderNumber: string;
  customerId: string;
  customerCode: string;
  customerName: string;
  lines: OrderLine[];
  status: 'draft' | 'quote' | 'order' | 'pending' | 'approved' | 'deposit_received' | 'closed' | 'cancelled';
  notes?: string;
  totalCBM: number;
  totalAmountILS: number;
  totalAmountUSD: number;
  createdBy?: string;
  createdByName?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Get orders response
 */
export interface GetOrdersResponse {
  success: boolean;
  data: OrderItem[];
  pagination: {
    total: number;
    limit: number;
    skip: number;
  };
}

/**
 * Update order status response
 */
export interface UpdateOrderStatusResponse {
  success: boolean;
  data: OrderItem;
}

/**
 * Get all orders with filters
 */
export async function getOrders(
  status?: string,
  customerId?: string,
  limit = 50,
  skip = 0
): Promise<GetOrdersResponse> {
  const params = new URLSearchParams();
  if (status) params.append('status', status);
  if (customerId) params.append('customerId', customerId);
  params.append('limit', limit.toString());
  params.append('skip', skip.toString());

  const response = await api.get(`/sales/orders?${params}`);
  return response.data;
}

/**
 * Update order status
 */
export async function updateOrderStatus(
  orderId: string,
  status: string
): Promise<UpdateOrderStatusResponse> {
  const response = await api.patch(`/sales/orders/${orderId}/status`, { status });
  return response.data;
}

/**
 * Update currency rate
 */
export async function updateCurrencyRate(): Promise<{ success: boolean }> {
  const response = await api.post('/currency/update', {});
  return response.data;
}

/**
 * Get sent orders from OrderLog
 */
export async function getSentOrders(limit = 50, skip = 0): Promise<GetOrdersResponse> {
  const params = new URLSearchParams();
  params.append('limit', limit.toString());
  params.append('skip', skip.toString());

  const response = await api.get(`/sales/orders/sent?${params}`);
  return response.data;
}
