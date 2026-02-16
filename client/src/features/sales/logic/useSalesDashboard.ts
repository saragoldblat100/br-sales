import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/features/auth';
import { activityApi } from '@/features/activity';
import { useUpdateCurrencyRate, useGetDraftOrder } from '@/features/orders';
import type { CustomerWithSpecialPrices, ItemPricing, SalesItem } from '@bravo/shared';
import type { CartItem } from '@/features/orders';
import type { SalesModuleId } from '../ui/SalesMainMenuView';

export function useSalesDashboard() {
  const { user, logout } = useAuth();
  const updateCurrencyRate = useUpdateCurrencyRate();

  const [activeModule, setActiveModule] = useState<SalesModuleId | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerWithSpecialPrices | null>(null);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [draftLoaded, setDraftLoaded] = useState(false);
  const [draftNotes, setDraftNotes] = useState('');

  // Fetch draft order when customer is selected
  const { data: draftData } = useGetDraftOrder(selectedCustomer?.customer?._id || null);

  useEffect(() => {
    const lastUpdate = localStorage.getItem('lastCurrencyUpdate');
    const today = new Date().toDateString();

    if (lastUpdate !== today) {
      updateCurrencyRate.mutate(undefined, {
        onSuccess: () => {
          localStorage.setItem('lastCurrencyUpdate', today);
        },
        onError: () => {
          // Silently ignore currency update errors - not critical
          console.log('Currency update skipped');
        },
      });
    }
  }, []);

  // Load draft into cart when customer changes
  useEffect(() => {
    if (draftData?.data && !draftLoaded && selectedCustomer) {
      const draft = draftData.data;
      const loadedItems: CartItem[] = draft.lines.map((line) => ({
        itemId: line.itemId,
        itemCode: line.itemCode,
        nameHe: line.description,
        englishDescription: line.description,
        qtyPerCarton: line.quantity / line.cartons,
        cartons: line.cartons,
        pricePerCarton: line.pricePerCarton,
        pricePerUnit: line.pricePerUnit,
        currency: line.currency as 'ILS' | 'USD',
        totalPrice: line.totalPrice,
        boxCBM: line.cbm / line.cartons,
      }));
      setCartItems(loadedItems);
      setDraftNotes(draft.notes || '');
      setDraftLoaded(true);
    }
  }, [draftData, draftLoaded, selectedCustomer]);

  const handleCustomerSelect = useCallback((customer: CustomerWithSpecialPrices) => {
    setSelectedCustomer(customer);
    setCartItems([]);
    setDraftLoaded(false); // Reset so draft can be loaded for new customer
    setDraftNotes('');
    activityApi.logView('customer_view', { customerName: customer.customer?.customerName || '' });
  }, []);

  const handleAddToCart = useCallback((item: SalesItem, pricing: ItemPricing, cartons: number) => {
    setCartItems((prev) => {
      const existing = prev.find((i) => i.itemId === item._id);
      if (existing) {
        return prev.map((i) =>
          i.itemId === item._id
            ? {
                ...i,
                cartons: i.cartons + cartons,
                totalPrice: (i.cartons + cartons) * i.pricePerCarton,
              }
            : i
        );
      }

      const newItem: CartItem = {
        itemId: item._id,
        itemCode: item.itemCode,
        nameHe: item.nameHe,
        englishDescription: item.englishDescription,
        imageUrl: item.imageUrl,
        qtyPerCarton: item.qtyPerCarton || 1,
        cartons,
        pricePerCarton: pricing.sellingPricePerCartonILS || 0,
        pricePerUnit: pricing.sellingPricePerUnitILS || 0,
        currency: 'ILS',
        totalPrice: (pricing.sellingPricePerCartonILS || 0) * cartons,
        boxCBM: item.boxCBM,
        priceSource: pricing.priceSource,
      };

      return [...prev, newItem];
    });
  }, []);

  const handleUpdateQuantity = useCallback((itemId: string, cartons: number) => {
    setCartItems((prev) =>
      prev.map((item) =>
        item.itemId === itemId
          ? { ...item, cartons, totalPrice: cartons * item.pricePerCarton }
          : item
      )
    );
  }, []);

  const handleRemoveItem = useCallback((itemId: string) => {
    setCartItems((prev) => prev.filter((item) => item.itemId !== itemId));
  }, []);

  const handleClearCart = useCallback(() => {
    setCartItems([]);
    setDraftNotes('');
  }, []);

  const handleOrderComplete = useCallback(() => {
    setSelectedCustomer(null);
    setCartItems([]);
    setDraftNotes('');
  }, []);

  const handleBackToMenu = useCallback(() => {
    setActiveModule(null);
    setSelectedCustomer(null);
    setCartItems([]);
    setDraftNotes('');
  }, []);

  const handleLogout = useCallback(async () => {
    await logout();
  }, [logout]);

  return {
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
    handleOrderComplete,
    handleBackToMenu,
    handleLogout,
  };
}
