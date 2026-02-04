import { api } from '@/shared/lib/api';
import type { CustomerListItem, CustomerWithSpecialPrices } from '@bravo/shared';

/**
 * Customer API endpoints
 */

/**
 * Search customers by name
 */
export async function searchCustomers(query: string): Promise<{ customers: CustomerListItem[] }> {
  const response = await api.get('/sales/customers/search', {
    params: { q: query },
  });
  return response.data;
}

/**
 * Get customer details with special prices
 */
export async function getCustomerDetails(customerCode: string): Promise<CustomerWithSpecialPrices> {
  const response = await api.get(`/sales/customers/${customerCode}`);
  // Response format: { customer: {...}, itemsWithSpecialPrices: [...] }
  return {
    customer: response.data.customer,
    itemsWithSpecialPrices: response.data.itemsWithSpecialPrices || [],
  };
}

/**
 * Create a new customer (for new visits/prospects)
 */
export async function createCustomer(customerName: string): Promise<{ success: boolean; customer: CustomerListItem }> {
  const response = await api.post('/sales/customers', { customerName });
  return response.data;
}
