import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createOrder, getDraftOrder, updateCurrencyRate, getOrders, updateOrderStatus, getSentOrders, type CreateOrderRequest } from './orders.api';

/**
 * Query keys for orders
 */
export const orderKeys = {
  all: ['orders'] as const,
  list: () => [...orderKeys.all, 'list'] as const,
  detail: (id: string) => [...orderKeys.all, 'detail', id] as const,
  draft: (customerId: string) => [...orderKeys.all, 'draft', customerId] as const,
};

/**
 * Hook to create an order
 */
export function useCreateOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateOrderRequest) => createOrder(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: orderKeys.all });
    },
  });
}

/**
 * Hook to update currency rate
 */
export function useUpdateCurrencyRate() {
  return useMutation({
    mutationFn: updateCurrencyRate,
  });
}

/**
 * Hook to get draft order for a customer
 */
export function useGetDraftOrder(customerId: string | null) {
  return useQuery({
    queryKey: orderKeys.draft(customerId || ''),
    queryFn: () => getDraftOrder(customerId!),
    enabled: !!customerId,
  });
}

/**
 * Hook to get all orders with filters
 */
export function useGetOrders(status?: string, customerId?: string) {
  return useQuery({
    queryKey: [...orderKeys.list(), { status, customerId }],
    queryFn: () => getOrders(status, customerId),
  });
}

/**
 * Hook to update order status
 */
export function useUpdateOrderStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ orderId, status }: { orderId: string; status: string }) =>
      updateOrderStatus(orderId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: orderKeys.all });
    },
  });
}

/**
 * Hook to get sent orders from OrderLog
 */
export function useGetSentOrders() {
  return useQuery({
    queryKey: [...orderKeys.list(), 'sent'],
    queryFn: () => getSentOrders(),
  });
}
