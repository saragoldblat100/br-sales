import { api } from '@/shared/lib/api';

export interface PricingCalcParams {
  portOfOrigin?: string;
  containerSizeCBM?: number;
  overrideSupplierPrice?: number;
  overrideFreight?: number;
  overrideMargin?: number;
  overrideUsdRate?: number;
  overrideBoxCBM?: number;
  overrideQtyPerCarton?: number;
}

export interface PricingChain {
  supplierPricePerCarton: number;
  freightCostPerContainer: number;
  freightCostPerCBM: number;
  freightCostPerCarton: number;
  freightSource: string;
  portOfOrigin: string;
  containerSizeCBM: number;
  totalCostPerCarton: number;
  marginPercentage: number;
  marginSource: string;
  categoryName: string;
  calculatedPricePerCartonUSD: number;
  calculatedPricePerUnitUSD: number;
  usdToIls: number;
  bankRate: number | null;
  rateMarginPercent: number;
  usdRateSource: string;
  calculatedPricePerCartonILS: number;
  calculatedPricePerUnitILS: number;
  lastSaleInfo: {
    priceILS: number;
    priceUSD: number;
    currency: string;
    date?: string;
  } | null;
  qtyPerCarton: number;
  boxCBM: number;
}

export interface PricingItem {
  _id: string;
  itemCode: string;
  englishDescription: string;
  nameHe: string;
  imageUrl?: string;
  qtyPerCarton: number;
  boxCBM: number;
  lastPurchaseDate?: string;
  lastPurchasePrice?: number;
}

export interface PricingCalcResult {
  item: PricingItem;
  pricingChain: PricingChain;
}

export interface SearchItem {
  _id: string;
  itemCode: string;
  englishDescription: string;
  nameHe?: string;
  imageUrl?: string;
}

export const pricingApi = {
  async searchItems(query: string): Promise<SearchItem[]> {
    const response = await api.get(`/sales/items/search?q=${encodeURIComponent(query)}`);
    return response.data.items || response.data.data || [];
  },

  async calculatePrice(itemId: string, params: PricingCalcParams): Promise<PricingCalcResult> {
    const response = await api.post(`/sales/items/${itemId}/pricing-calculator`, params);
    return response.data;
  },
};
