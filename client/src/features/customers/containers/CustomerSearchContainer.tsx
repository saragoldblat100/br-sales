import type { CustomerWithSpecialPrices } from '@bravo/shared';
import { CustomerSearchView } from '../ui/CustomerSearchView';
import { useCustomerSearch } from '../logic/useCustomerSearch';

interface CustomerSearchContainerProps {
  onCustomerSelect: (customer: CustomerWithSpecialPrices) => void;
  selectedCustomer?: CustomerWithSpecialPrices | null;
}

export function CustomerSearchContainer({
  onCustomerSelect,
  selectedCustomer,
}: CustomerSearchContainerProps) {
  const {
    query,
    setQuery,
    isSearching,
    isLoadingDetails,
    searchResults,
    selectedCustomerCode,
    handleSelectCustomer,
    handleChangeCustomer,
    showCreateForm,
    setShowCreateForm,
    newCustomerName,
    setNewCustomerName,
    handleCreateCustomer,
    createError,
    isCreating,
    shouldShowResults,
  } = useCustomerSearch({ onCustomerSelect });

  return (
    <CustomerSearchView
      query={query}
      onQueryChange={setQuery}
      isSearching={isSearching}
      isLoadingDetails={isLoadingDetails}
      shouldShowResults={shouldShowResults}
      searchResults={searchResults}
      selectedCustomerCode={selectedCustomerCode}
      onSelectCustomer={handleSelectCustomer}
      selectedCustomer={selectedCustomer}
      onChangeCustomer={handleChangeCustomer}
      showCreateForm={showCreateForm}
      onShowCreateForm={() => setShowCreateForm(true)}
      newCustomerName={newCustomerName}
      onNewCustomerNameChange={setNewCustomerName}
      onCreateCustomer={handleCreateCustomer}
      onCancelCreate={() => {
        setShowCreateForm(false);
        setNewCustomerName('');
      }}
      isCreating={isCreating}
      createError={createError}
    />
  );
}
