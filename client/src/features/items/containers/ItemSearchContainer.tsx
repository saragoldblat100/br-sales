import type { ReactNode } from 'react';
import type { CustomerWithSpecialPrices, ItemPricing, SalesItem } from '@bravo/shared';
import { ItemSearchView } from '../ui/ItemSearchView';
import { ItemDetailModalContainer } from './ItemDetailModalContainer';
import { useItemSearch } from '../logic/useItemSearch';

interface ItemSearchContainerProps {
  customer: CustomerWithSpecialPrices;
  onAddToCart: (item: SalesItem, pricing: ItemPricing, cartons: number) => void;
  onBackToMenu: () => void;
  onChangeCustomer: () => void;
  onLogout: () => void;
  userRole?: string;
  cartItemsCount: number;
  cart: ReactNode;
  showCartModal: boolean;
  onOpenCart: () => void;
  onCloseCart: () => void;
}

export function ItemSearchContainer({
  customer,
  onAddToCart,
  onBackToMenu,
  onChangeCustomer,
  onLogout,
  userRole,
  cartItemsCount,
  cart,
  showCartModal,
  onOpenCart,
  onCloseCart,
}: ItemSearchContainerProps) {
  const {
    searchMode,
    setSearchMode,
    searchQuery,
    setSearchQuery,
    categories,
    selectedCategoryId,
    setSelectedCategoryId,
    displayedItems,
    isLoading,
    emptyStateMessage,
    errorMessage,
    selectedItem,
    setSelectedItem,
    searchModes,
    showSearchInput,
  } = useItemSearch(customer);

  return (
    <ItemSearchView
      customerName={customer.customer.customerName}
      customerCode={customer.customer.customerCode}
      onBackToMenu={onBackToMenu}
      onChangeCustomer={onChangeCustomer}
      onLogout={onLogout}
      userRole={userRole}
      searchMode={searchMode}
      searchModes={searchModes}
      onSelectMode={setSearchMode}
      searchQuery={searchQuery}
      onSearchQueryChange={setSearchQuery}
      showSearchInput={showSearchInput}
      categories={categories}
      selectedCategoryId={selectedCategoryId}
      onSelectCategory={setSelectedCategoryId}
      displayedItems={displayedItems}
      isLoading={isLoading}
      emptyStateMessage={emptyStateMessage}
      errorMessage={errorMessage}
      onSelectItem={setSelectedItem}
      itemDetailModal={
        selectedItem ? (
          <ItemDetailModalContainer
            item={selectedItem}
            customerCode={customer.customer.customerCode}
            onClose={() => setSelectedItem(null)}
            onAddToCart={onAddToCart}
          />
        ) : null
      }
      cartItemsCount={cartItemsCount}
      cart={cart}
      showCartModal={showCartModal}
      onOpenCart={onOpenCart}
      onCloseCart={onCloseCart}
    />
  );
}
