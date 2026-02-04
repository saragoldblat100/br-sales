import { useEffect, useState, useRef, useCallback } from 'react';
import type { SalesItem, ItemPricing } from '@bravo/shared';
import { useCalculatePrice } from '../api';

interface UseItemDetailModalParams {
  item: SalesItem;
  customerCode: string;
  onAddToCart: (item: SalesItem, pricing: ItemPricing, cartons: number) => void;
  onClose: () => void;
}

export function useItemDetailModal({ item, customerCode, onAddToCart, onClose }: UseItemDetailModalParams) {
  const [cartons, setCartons] = useState(1);
  const [showCurrency, setShowCurrency] = useState<'ILS' | 'USD'>('ILS');
  const calculatePrice = useCalculatePrice();
  const debounceRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    // Clear previous timeout
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    // Wait 500ms before calculating
    debounceRef.current = setTimeout(() => {
      calculatePrice.mutate({
        itemId: item._id,
        customerCode,
        quantity: cartons * (item.qtyPerCarton || 1),
      });
    }, 500);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cartons, customerCode, item._id, item.qtyPerCarton]);

  const pricing = calculatePrice.data?.pricing;
  const isLoading = calculatePrice.isPending;
  const errorMessage = calculatePrice.error ? 'שגיאה בחישוב מחיר' : undefined;

  const pricePerUnit =
    showCurrency === 'ILS' ? pricing?.sellingPricePerUnitILS : pricing?.sellingPricePerUnitUSD;
  const pricePerCarton =
    showCurrency === 'ILS' ? pricing?.sellingPricePerCartonILS : pricing?.sellingPricePerCartonUSD;
  const totalPrice = pricePerCarton ? pricePerCarton * cartons : undefined;

  const formatPrice = (value?: number) => {
    if (value === undefined || value === null) return '-';
    const symbol = showCurrency === 'ILS' ? '₪' : '$';
    return `${symbol}${value.toLocaleString('he-IL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const toggleCurrency = () => {
    setShowCurrency((prev) => (prev === 'ILS' ? 'USD' : 'ILS'));
  };

  return {
    cartons,
    showCurrency,
    pricePerUnitDisplay: formatPrice(pricePerUnit),
    pricePerCartonDisplay: formatPrice(pricePerCarton),
    totalPriceDisplay: formatPrice(totalPrice),
    priceSource: pricing?.priceSource,
    cartonsPerContainer: item.boxCBM ? Math.floor(67 / item.boxCBM) : undefined,
    totalCBM: pricing?.totalCBM || (item.boxCBM ? item.boxCBM * cartons : undefined),
    usdToIls: pricing?.usdToIls,
    isLoading,
    errorMessage,
    setCartons,
    toggleCurrency,
    handleAddToCart: () => {
      if (pricing) {
        onAddToCart(item, pricing, cartons);
        onClose();
      }
    },
  };
}
