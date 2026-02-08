import { useEffect, useState, useRef, useMemo } from 'react';
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

  // Check if item has special price - can display immediately without server call
  const hasSpecialPrice = item.hasSpecialPrice && item.specialPrice?.price;

  // Create instant pricing from special price data (no server call needed)
  const instantPricing = useMemo((): ItemPricing | null => {
    if (!hasSpecialPrice || !item.specialPrice) return null;

    const currency = (item.specialPrice.currency || '').toUpperCase();
    const isUSD = currency === 'USD' || currency === '$' || currency === 'DOLLAR';
    const pricePerCarton = item.specialPrice.price;
    const qtyPerCarton = item.qtyPerCarton || 1;

    // Estimate USD/ILS rate (will be updated from server if needed)
    const estimatedRate = 3.7;

    return {
      itemCode: item.itemCode,
      itemName: item.englishDescription,
      itemNameHe: item.nameHe,
      qtyPerCarton,
      boxCBM: item.boxCBM,
      priceSource: 'special_price',
      sellingPricePerCartonUSD: isUSD ? pricePerCarton : pricePerCarton / estimatedRate,
      sellingPricePerUnitUSD: isUSD ? pricePerCarton / qtyPerCarton : pricePerCarton / estimatedRate / qtyPerCarton,
      sellingPricePerCartonILS: isUSD ? pricePerCarton * estimatedRate : pricePerCarton,
      sellingPricePerUnitILS: isUSD ? pricePerCarton * estimatedRate / qtyPerCarton : pricePerCarton / qtyPerCarton,
      requestedQuantity: cartons * qtyPerCarton,
      numberOfCartons: cartons,
      totalCBM: item.boxCBM ? item.boxCBM * cartons : undefined,
      usdToIls: estimatedRate,
    };
  }, [hasSpecialPrice, item, cartons]);

  useEffect(() => {
    // If has special price, no need to call server for initial load
    if (hasSpecialPrice) return;

    // Clear previous timeout
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    // Calculate price from server
    debounceRef.current = setTimeout(() => {
      calculatePrice.mutate({
        itemId: item._id,
        customerCode,
        quantity: cartons * (item.qtyPerCarton || 1),
      });
    }, 100); // Short delay to batch rapid changes

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cartons, customerCode, item._id, item.qtyPerCarton, hasSpecialPrice]);

  // Use instant pricing for special prices, server pricing for others
  const pricing = hasSpecialPrice ? instantPricing : calculatePrice.data?.pricing;
  const isLoading = hasSpecialPrice ? false : calculatePrice.isPending;
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
