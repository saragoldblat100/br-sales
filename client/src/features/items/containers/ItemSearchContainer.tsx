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
    selectedItem,
    setSelectedItem,
    searchModes,
    showSearchInput,
  } = useItemSearch(customer);

  return (
    <ItemSearchView
      customerName={customer.customer.customerName}
      onBackToMenu={onBackToMenu}
      onChangeCustomer={onChangeCustomer}
      onLogout={onLogout}
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
