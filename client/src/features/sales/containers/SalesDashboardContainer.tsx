import { useState } from 'react';
import { SalesDashboardView } from '../ui/SalesDashboardView';
import { CollectionModuleView } from '../ui/CollectionModuleView';
import { InventoryModuleView } from '../ui/InventoryModuleView';
import { SalesMainMenuContainer } from './SalesMainMenuContainer';
import { useSalesDashboard } from '../logic/useSalesDashboard';
import { CustomerSearch } from '@/features/customers';
import { ItemSearch } from '@/features/items';
import { Cart } from '@/features/orders';

export function SalesDashboardContainer() {
  const [showCartModal, setShowCartModal] = useState(false);

  const {
    user,
    activeModule,
    selectedCustomer,
    cartItems,
    setActiveModule,
    handleCustomerSelect,
    handleAddToCart,
    handleUpdateQuantity,
    handleRemoveItem,
    handleClearCart,
    handleOrderComplete,
    handleBackToMenu,
    handleLogout,
  } = useSalesDashboard();

  if (!user) return null;

  if (activeModule === null) {
    return (
      <SalesMainMenuContainer
        user={user}
        onSelectModule={setActiveModule}
        onLogout={handleLogout}
      />
    );
  }

  if (activeModule === 'collection') {
    return <CollectionModuleView userName={user.name} onBack={handleBackToMenu} />;
  }

  if (activeModule === 'inventory') {
    return <InventoryModuleView userName={user.name} onBack={handleBackToMenu} />;
  }

  return (
    <SalesDashboardView
      userName={user.name}
      onBackToMenu={handleBackToMenu}
      onLogout={handleLogout}
      customerSearch={
        <CustomerSearch
          onCustomerSelect={handleCustomerSelect}
          selectedCustomer={selectedCustomer}
        />
      }
      itemSearch={
        selectedCustomer?.customer?.customerCode ? (
          <ItemSearch
            customer={selectedCustomer}
            onAddToCart={handleAddToCart}
            onBackToMenu={handleBackToMenu}
            onChangeCustomer={() => handleCustomerSelect(null as any)}
            onLogout={handleLogout}
            cartItemsCount={cartItems.length}
            cart={
              <Cart
                items={cartItems}
                customerId={selectedCustomer?.customer?._id || ''}
                customerCode={selectedCustomer?.customer?.customerCode || ''}
                customerName={selectedCustomer?.customer?.customerName || ''}
                onUpdateQuantity={handleUpdateQuantity}
                onRemoveItem={handleRemoveItem}
                onClearCart={handleClearCart}
                onOrderComplete={handleOrderComplete}
              />
            }
            showCartModal={showCartModal}
            onOpenCart={() => setShowCartModal(true)}
            onCloseCart={() => setShowCartModal(false)}
          />
        ) : null
      }
      showItemSearch={!!selectedCustomer?.customer?.customerCode}
      cart={null}
    />
  );
}
