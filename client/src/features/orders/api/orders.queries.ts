import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createOrder, getDraftOrder, updateCurrencyRate, type CreateOrderRequest } from './orders.api';

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
