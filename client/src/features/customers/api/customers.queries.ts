import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { searchCustomers, getCustomerDetails, createCustomer } from './customers.api';

/**
 * Query keys for customer data
 */
export const customerKeys = {
  all: ['customers'] as const,
  search: (query: string) => [...customerKeys.all, 'search', query] as const,
  details: (customerCode: string) => [...customerKeys.all, 'details', customerCode] as const,
};

/**
 * Hook to search customers
 */
export function useSearchCustomers(query: string) {
  return useQuery({
    queryKey: customerKeys.search(query),
    queryFn: () => searchCustomers(query),
    enabled: query.length >= 2, // Only search when query is at least 2 chars
    staleTime: 30 * 1000, // 30 seconds
  });
}

/**
 * Hook to get customer details with special prices
 */
export function useCustomerDetails(customerCode: string | null) {
  return useQuery({
    queryKey: customerKeys.details(customerCode || ''),
    queryFn: () => getCustomerDetails(customerCode!),
    enabled: !!customerCode, // Only fetch when customerCode is provided
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook to create a new customer
 */
export function useCreateCustomer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (customerName: string) => createCustomer(customerName),
    onSuccess: () => {
      // Invalidate search results to refresh the list
      queryClient.invalidateQueries({ queryKey: customerKeys.all });
    },
  });
}
