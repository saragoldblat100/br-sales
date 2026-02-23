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
}: CartContainerProps) {
  const {
    notes,
    setNotes,
    successMessage,
    isSubmittingQuote,
    isSubmittingOrder,
    errorMessage,
    totalItems,
    totalUnits,
    totalCBM,
    totalAmountILS,
    totalAmountUSD,
    containerCount,
    formatPrice,
    handleSubmitOrder,
    showCurrencyModal,
    handleCurrencySelected,
  } = useCart({
    items,
    customerId,
    customerCode,
    customerName,
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
      successMessage={successMessage}
      isSubmittingQuote={isSubmittingQuote}
      isSubmittingOrder={isSubmittingOrder}
      errorMessage={errorMessage}
      showCurrencyModal={showCurrencyModal}
      onCurrencySelected={handleCurrencySelected}
    />
  );
}
