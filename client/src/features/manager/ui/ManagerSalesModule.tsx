import { useState } from 'react';
import { useAuth } from '@/features/auth';
import { useSalesDashboard } from '@/features/sales/logic/useSalesDashboard';
import { SalesDashboardView } from '@/features/sales/ui/SalesDashboardView';
import { CustomerSearch } from '@/features/customers';
import { ItemSearch } from '@/features/items';
import { Cart } from '@/features/orders';

interface ManagerSalesModuleProps {
  onBack: () => void;
}

export function ManagerSalesModule({ onBack }: ManagerSalesModuleProps) {
  const [showCartModal, setShowCartModal] = useState(false);
  const { user } = useAuth();

  const {
    selectedCustomer,
    cartItems,
    draftNotes,
    handleCustomerSelect,
    handleAddToCart,
    handleUpdateQuantity,
    handleRemoveItem,
    handleClearCart,
    handleLogout,
  } = useSalesDashboard();

  if (!user) return null;

  return (
    <SalesDashboardView
      userName={user.name}
      onBackToMenu={onBack}
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
            onBackToMenu={onBack}
            onLogout={handleLogout}
            userRole={user.role}
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
