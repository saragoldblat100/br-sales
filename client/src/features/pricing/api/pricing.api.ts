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

export interface PartialPricingChain {
  supplierPricePerCarton: number;
  boxCBM: number;
  qtyPerCarton: number;
  usdToIls: number;
  freightCostPerCarton: number;
  marginPercentage: number;
}

export interface PartialPricingResult {
  partial: true;
  missingFields: Array<{ field: string; reason: string }>;
  item: PricingItem;
  partialPricingChain: PartialPricingChain;
}

export interface UpdateFreightParams {
  portOfOrigin?: string;
  containerSizeCBM?: number;
  freightCost: number;
  notes?: string;
}

export const pricingApi = {
  async searchItems(query: string): Promise<SearchItem[]> {
    const response = await api.get(`/sales/items/search?q=${encodeURIComponent(query)}`);
    return response.data.items || response.data.data || [];
  },

  async getItemsInRange(from: string, to: string): Promise<SearchItem[]> {
    const response = await api.get(
      `/sales/items/range?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}&limit=50`
    );
    return response.data.items || [];
  },

  async calculatePrice(
    itemId: string,
    params: PricingCalcParams
  ): Promise<PricingCalcResult | PartialPricingResult> {
    try {
      const response = await api.post(`/sales/items/${itemId}/pricing-calculator`, params);
      return response.data;
    } catch (err: any) {
      // If it's a 400 with partial data, return it instead of throwing
      if (err.response?.status === 400 && err.response?.data?.partialPricingChain) {
        return {
          partial: true,
          missingFields: err.response.data.missingFields || [],
          item: err.response.data.item,
          partialPricingChain: err.response.data.partialPricingChain,
        } as PartialPricingResult;
      }
      // Otherwise throw the error normally
      throw err;
    }
  },

  async updateFreightRate(params: UpdateFreightParams) {
    const response = await api.post('/sales/freight-rates/update', params);
    return response.data;
  },
};
