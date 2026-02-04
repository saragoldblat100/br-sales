import type { SalesItem, ItemPricing } from '@bravo/shared';
import { ItemDetailModalView } from '../ui/ItemDetailModalView';
import { useItemDetailModal } from '../logic/useItemDetailModal';

interface ItemDetailModalContainerProps {
  item: SalesItem;
  customerCode: string;
  onClose: () => void;
  onAddToCart: (item: SalesItem, pricing: ItemPricing, cartons: number) => void;
}

export function ItemDetailModalContainer({
  item,
  customerCode,
  onClose,
  onAddToCart,
}: ItemDetailModalContainerProps) {
  const {
    cartons,
    showCurrency,
    pricePerUnitDisplay,
    pricePerCartonDisplay,
    totalPriceDisplay,
    priceSource,
    cartonsPerContainer,
    totalCBM,
    isLoading,
    errorMessage,
    setCartons,
    toggleCurrency,
    handleAddToCart,
  } = useItemDetailModal({ item, customerCode, onAddToCart, onClose });

  return (
    <ItemDetailModalView
      item={item}
      cartons={cartons}
      showCurrency={showCurrency}
      pricePerUnitDisplay={pricePerUnitDisplay}
      pricePerCartonDisplay={pricePerCartonDisplay}
      totalPriceDisplay={totalPriceDisplay}
      priceSource={priceSource}
      cartonsPerContainer={cartonsPerContainer}
      totalCBM={totalCBM}
      isLoading={isLoading}
      errorMessage={errorMessage}
      onClose={onClose}
      onAddToCart={handleAddToCart}
      onSetCartons={setCartons}
      onDecreaseCartons={() => setCartons(Math.max(1, cartons - 1))}
      onIncreaseCartons={() => setCartons(cartons + 1)}
      onToggleCurrency={toggleCurrency}
    />
  );
}
