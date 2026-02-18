import { useState } from 'react';
import { SalesDashboardView } from '../ui/SalesDashboardView';
import { CollectionModuleView } from '../ui/CollectionModuleView';
import { InventoryModule } from '@/features/inventory';
import { SalesMainMenuContainer } from './SalesMainMenuContainer';
import { useSalesDashboard } from '../logic/useSalesDashboard';
import { CustomerSearch } from '@/features/customers';
import { ItemSearch } from '@/features/items';
import { Cart, OrdersModule } from '@/features/orders';

export function SalesDashboardContainer() {
  const [showCartModal, setShowCartModal] = useState(false);

  const {
    user,
    activeModule,
    selectedCustomer,
    cartItems,
    draftNotes,
    setActiveModule,
    handleCustomerSelect,
    handleAddToCart,
    handleUpdateQuantity,
    handleRemoveItem,
    handleClearCart,
    handleBackToMenu,
    handleLogout,
  } = useSalesDashboard();

  if (!user) return null;

  const canUploadInventory =
    user.role === 'admin' ||
    user.role === 'manager' ||
    user.role === 'accountant' ||
    user.role === 'logistics';

  const canMarkSold =
    canUploadInventory || user.role === 'sales_agent';

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
    return <CollectionModuleView userName={user.name} onBack={handleBackToMenu} onLogout={handleLogout} />;
  }

  if (activeModule === 'inventory') {
    return (
      <InventoryModule
        user={{ name: user.name, username: user.username, role: user.role }}
        onBack={handleBackToMenu}
        onLogout={handleLogout}
        canUpload={canUploadInventory}
        canMarkSold={canMarkSold}
      />
    );
  }

  if (activeModule === 'orders') {
    return <OrdersModule onBack={handleBackToMenu} />;
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
                initialNotes={draftNotes}
                onUpdateQuantity={handleUpdateQuantity}
                onRemoveItem={handleRemoveItem}
                onClearCart={handleClearCart}
              />
            }
            showCartModal={showCartModal}
            onOpenCart={() => setShowCartModal(true)}
            onCloseCart={() => setShowCartModal(false)}
          />
        ) : null
      }
      showItemSearch={!!selectedCustomer?.customer?.customerCode}
    />
  );
}
