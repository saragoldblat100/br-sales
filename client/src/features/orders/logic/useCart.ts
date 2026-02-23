import { useEffect, useMemo, useRef, useState } from 'react';
import type { CartItem, OrderLine } from '../api';
import { useCreateOrder } from '../api';
import { api } from '@/shared/lib/api';

interface UseCartParams {
  items: CartItem[];
  customerId: string;
  customerCode: string;
  customerName: string;
  initialNotes?: string;
}

export function useCart({
  items,
  customerId,
  customerCode,
  customerName,
  initialNotes,
}: UseCartParams) {
  const [notes, setNotes] = useState(initialNotes || '');
  const [submittingType, setSubmittingType] = useState<'quote' | 'order' | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showCurrencyModal, setShowCurrencyModal] = useState(false);
  const [pendingOrderType, setPendingOrderType] = useState<'quote' | 'order' | null>(null);
  const successTimerRef = useRef<number | null>(null);
  const createOrderMutation = useCreateOrder();

  // Sync notes when a new draft is loaded or customer changes
  useEffect(() => {
    setNotes(initialNotes || '');
  }, [initialNotes]);

  useEffect(() => {
    return () => {
      if (successTimerRef.current) {
        window.clearTimeout(successTimerRef.current);
      }
    };
  }, []);

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

  const handleSubmitOrder = (status: 'draft' | 'quote' | 'order') => {
    // For draft status, submit immediately without currency selection
    if (status === 'draft') {
      submitOrderWithCurrency(status, items[0]?.currency || 'ILS');
      return;
    }

    // For quote and order, show currency selection modal
    setPendingOrderType(status);
    setShowCurrencyModal(true);
  };

  const handleCurrencySelected = (currency: 'USD' | 'ILS') => {
    if (pendingOrderType) {
      submitOrderWithCurrency(pendingOrderType, currency);
      // Close modal after submission starts
      setShowCurrencyModal(false);
    }
  };

  const submitOrderWithCurrency = async (status: 'draft' | 'quote' | 'order', currency: 'USD' | 'ILS') => {
    try {
      setSubmittingType(status === 'quote' ? 'quote' : 'order');

      // Get current exchange rate from server
      // Use usdRateWithMargin to match the rate used in pricing calculations
      const rateResponse = await api.get('/currency/current');
      const exchangeRate = rateResponse.data.rate.usdRateWithMargin;

      // Convert all items to the selected currency
      const lines: OrderLine[] = items.map((item) => {
        let pricePerUnit = item.pricePerUnit;
        let pricePerCarton = item.pricePerCarton;
        let totalPrice = item.totalPrice;

        // If item is in different currency than selected, convert it
        if (item.currency !== currency) {
          if (currency === 'ILS' && item.currency === 'USD') {
            // Convert USD to ILS
            pricePerUnit = pricePerUnit * exchangeRate;
            pricePerCarton = pricePerCarton * exchangeRate;
            totalPrice = totalPrice * exchangeRate;
          } else if (currency === 'USD' && item.currency === 'ILS') {
            // Convert ILS to USD
            pricePerUnit = pricePerUnit / exchangeRate;
            pricePerCarton = pricePerCarton / exchangeRate;
            totalPrice = totalPrice / exchangeRate;
          }
        }

        return {
          itemId: item.itemId,
          itemCode: item.itemCode,
          description: item.nameHe || item.englishDescription || item.itemCode,
          quantity: item.cartons * item.qtyPerCarton,
          cartons: item.cartons,
          pricePerUnit,
          pricePerCarton,
          totalPrice,
          currency, // Use selected currency for all items
          cbm: (item.boxCBM || 0) * item.cartons,
        };
      });

      await createOrderMutation.mutateAsync({
        customerId,
        customerCode,
        customerName,
        lines,
        status,
        notes,
        currency, // Pass selected currency
      });

      if (successTimerRef.current) {
        window.clearTimeout(successTimerRef.current);
      }
      setSuccessMessage(
        status === 'quote' ? 'ההצעה נשמרה בהצלחה' : 'ההזמנה נשלחה בהצלחה'
      );
      successTimerRef.current = window.setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);

      // Reset modal state
      setPendingOrderType(null);
    } catch {
      // Error handled via mutation state
      // Reset modal state on error too
      setPendingOrderType(null);
    } finally {
      setSubmittingType(null);
    }
  };

  return {
    notes,
    setNotes,
    successMessage,
    isSubmittingQuote: submittingType === 'quote',
    isSubmittingOrder: submittingType === 'order',
    errorMessage: createOrderMutation.error ? 'שגיאה ביצירת הזמנה' : undefined,
    totalItems,
    totalUnits,
    totalCBM,
    totalAmountILS,
    totalAmountUSD,
    containerCount: totalCBM / 67,
    formatPrice,
    handleSubmitOrder,
    showCurrencyModal,
    pendingOrderType,
    handleCurrencySelected,
  };
}
