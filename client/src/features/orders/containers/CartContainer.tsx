import type { CartItem } from '../api';
import { CartView } from '../ui/CartView';
import { useCart } from '../logic/useCart';

interface CartContainerProps {
  items: CartItem[];
  customerId: string;
  customerCode: string;
  customerName: string;
  initialNotes?: string;
  onUpdateQuantity: (itemId: string, cartons: number) => void;
  onRemoveItem: (itemId: string) => void;
  onClearCart: () => void;
  onOrderComplete: () => void;
}

export function CartContainer({
  items,
  customerId,
  customerCode,
  customerName,
  initialNotes,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  onOrderComplete,
}: CartContainerProps) {
  const {
    notes,
    setNotes,
    showSuccess,
    isSubmitting,
    errorMessage,
    totalItems,
    totalUnits,
    totalCBM,
    totalAmountILS,
    totalAmountUSD,
    containerCount,
    formatPrice,
    handleSubmitOrder,
  } = useCart({
    items,
    customerId,
    customerCode,
    customerName,
    onClearCart,
    onOrderComplete,
    initialNotes,
  });

  return (
    <CartView
      items={items}
      notes={notes}
      onNotesChange={setNotes}
      onUpdateQuantity={onUpdateQuantity}
      onRemoveItem={onRemoveItem}
      onClearCart={onClearCart}
      onSubmitOrder={handleSubmitOrder}
      totalItems={totalItems}
      totalUnits={totalUnits}
      totalCBM={totalCBM}
      totalAmountILS={totalAmountILS}
      totalAmountUSD={totalAmountUSD}
      containerCount={containerCount}
      formatPrice={formatPrice}
      showSuccess={showSuccess}
      isSubmitting={isSubmitting}
      errorMessage={errorMessage}
    />
  );
}
