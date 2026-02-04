import { useCallback, useEffect, useState } from 'react';
import type { CustomerListItem, CustomerWithSpecialPrices } from '@bravo/shared';
import { useSearchCustomers, useCustomerDetails, useCreateCustomer } from '../api';

interface UseCustomerSearchParams {
  onCustomerSelect: (customer: CustomerWithSpecialPrices) => void;
}

export function useCustomerSearch({ onCustomerSelect }: UseCustomerSearchParams) {
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newCustomerName, setNewCustomerName] = useState('');
  const [selectedCustomerCode, setSelectedCustomerCode] = useState<string | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  const { data: searchData, isLoading: isSearching } = useSearchCustomers(debouncedQuery);
  const { data: customerDetails, isLoading: isLoadingDetails } = useCustomerDetails(selectedCustomerCode);
  const createCustomerMutation = useCreateCustomer();

  useEffect(() => {
    if (customerDetails && selectedCustomerCode) {
      onCustomerSelect(customerDetails);
      setSelectedCustomerCode(null);
      setQuery('');
    }
  }, [customerDetails, selectedCustomerCode, onCustomerSelect]);

  const handleSelectCustomer = useCallback((customer: CustomerListItem) => {
    setSelectedCustomerCode(customer.customerCode);
  }, []);

  const handleCreateCustomer = useCallback(async () => {
    if (!newCustomerName.trim()) return;

    try {
      const result = await createCustomerMutation.mutateAsync(newCustomerName.trim());
      setSelectedCustomerCode(result.customer.customerCode);
      setNewCustomerName('');
      setShowCreateForm(false);
    } catch {
      // Error handled via mutation error
    }
  }, [createCustomerMutation, newCustomerName]);

  const handleChangeCustomer = useCallback(() => {
    setQuery('');
    onCustomerSelect({
      customer: { _id: '', customerCode: '', customerName: '' },
      itemsWithSpecialPrices: [],
    });
  }, [onCustomerSelect]);

  return {
    query,
    setQuery,
    isSearching,
    isLoadingDetails,
    searchResults: searchData?.customers ?? [],
    selectedCustomerCode,
    handleSelectCustomer,
    handleChangeCustomer,
    showCreateForm,
    setShowCreateForm,
    newCustomerName,
    setNewCustomerName,
    handleCreateCustomer,
    createError: createCustomerMutation.error?.message,
    isCreating: createCustomerMutation.isPending,
    shouldShowResults: debouncedQuery.length >= 2,
  };
}
