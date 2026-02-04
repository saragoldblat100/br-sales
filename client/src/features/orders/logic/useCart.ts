import { useMemo, useState } from 'react';
import type { CartItem, OrderLine } from '../api';
import { useCreateOrder } from '../api';

interface UseCartParams {
  items: CartItem[];
  customerId: string;
  customerCode: string;
  customerName: string;
  onClearCart: () => void;
  onOrderComplete: () => void;
}

export function useCart({
  items,
  customerId,
  customerCode,
  customerName,
  onClearCart,
  onOrderComplete,
}: UseCartParams) {
  const [notes, setNotes] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const createOrderMutation = useCreateOrder();

  const totalItems = useMemo(
    () => items.reduce((sum, item) => sum + item.cartons, 0),
    [items]
  );
  const totalUnits = useMemo(
    () => items.reduce((sum, item) => sum + item.cartons * item.qtyPerCarton, 0),
    [items]
  );
  const totalCBM = useMemo(
    () => items.reduce((sum, item) => sum + (item.boxCBM || 0) * item.cartons, 0),
    [items]
  );
  const totalAmountILS = useMemo(
    () =>
      items
        .filter((item) => item.currency === 'ILS')
        .reduce((sum, item) => sum + item.totalPrice, 0),
    [items]
  );
  const totalAmountUSD = useMemo(
    () =>
      items
        .filter((item) => item.currency === 'USD')
        .reduce((sum, item) => sum + item.totalPrice, 0),
    [items]
  );

  const formatPrice = (amount: number, currency: 'ILS' | 'USD') => {
    const symbol = currency === 'ILS' ? '₪' : '$';
    return `${symbol}${amount.toLocaleString('he-IL', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const handleSubmitOrder = async (status: 'draft' | 'quote' | 'order') => {
    const lines: OrderLine[] = items.map((item) => ({
      itemId: item.itemId,
      itemCode: item.itemCode,
      description: item.nameHe || item.englishDescription || item.itemCode,
      quantity: item.cartons * item.qtyPerCarton,
      cartons: item.cartons,
      pricePerUnit: item.pricePerUnit,
      pricePerCarton: item.pricePerCarton,
      totalPrice: item.totalPrice,
      currency: item.currency,
      cbm: (item.boxCBM || 0) * item.cartons,
    }));

    try {
      await createOrderMutation.mutateAsync({
        customerId,
        customerCode,
        customerName,
        lines,
        status,
        notes,
      });

      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        onClearCart();
        onOrderComplete();
      }, 2000);
    } catch {
      // Error handled via mutation state
    }
  };

  return {
    notes,
    setNotes,
    showSuccess,
    isSubmitting: createOrderMutation.isPending,
    errorMessage: createOrderMutation.error ? 'שגיאה ביצירת הזמנה' : undefined,
    totalItems,
    totalUnits,
    totalCBM,
    totalAmountILS,
    totalAmountUSD,
    containerCount: totalCBM / 67,
    formatPrice,
    handleSubmitOrder,
  };
}
