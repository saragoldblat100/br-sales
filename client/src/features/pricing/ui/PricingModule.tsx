import { useState, useCallback, useRef, useEffect } from 'react';
import { isAxiosError } from 'axios';
import { pricingApi, type PricingCalcResult, type SearchItem } from '../api/pricing.api';
import { PricingModuleView } from './PricingModuleView';

interface PricingModuleProps {
  onBack: () => void;
}

export interface PricingOverrides {
  supplierPrice: string;
  freight: string;
  margin: string;
  bankRate: string;
  usdRate: string;
  boxCBM: string;
  qtyPerCarton: string;
}

const EMPTY_OVERRIDES: PricingOverrides = {
  supplierPrice: '', freight: '', margin: '', bankRate: '', usdRate: '', boxCBM: '', qtyPerCarton: '',
};

export function PricingModule({ onBack }: PricingModuleProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchItem[]>([]);
  const [searching, setSearching] = useState(false);

  const [selectedItem, setSelectedItem] = useState<SearchItem | null>(null);
  const [result, setResult] = useState<PricingCalcResult | null>(null);
  const [calcLoading, setCalcLoading] = useState(false);
  const [calcError, setCalcError] = useState<string | null>(null);
  const [missingFields, setMissingFields] = useState<string[]>([]);

  const [overrides, setOverrides] = useState<PricingOverrides>(EMPTY_OVERRIDES);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Search with debounce
  const handleSearchChange = useCallback((query: string) => {
    setSearchQuery(query);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (query.length < 2) { setSearchResults([]); return; }

    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const items = await pricingApi.searchItems(query);
        setSearchResults(items);
      } catch { setSearchResults([]); }
      finally { setSearching(false); }
    }, 300);
  }, []);

  // Calculate price - called only on button click
  const calculate = useCallback(async (itemId: string, ov: PricingOverrides) => {
    setCalcLoading(true);
    setCalcError(null);
    setMissingFields([]);
    try {
      const params: Record<string, number> = {};
      if (ov.supplierPrice !== '') params.overrideSupplierPrice = parseFloat(ov.supplierPrice);
      if (ov.freight !== '') params.overrideFreight = parseFloat(ov.freight);
      if (ov.margin !== '') params.overrideMargin = parseFloat(ov.margin);
      if (ov.usdRate !== '') params.overrideUsdRate = parseFloat(ov.usdRate);
      if (ov.boxCBM !== '') params.overrideBoxCBM = parseFloat(ov.boxCBM);
      if (ov.qtyPerCarton !== '') params.overrideQtyPerCarton = parseFloat(ov.qtyPerCarton);

      const data = await pricingApi.calculatePrice(itemId, params);
      setResult(data);
    } catch (err: unknown) {
      if (isAxiosError(err)) {
        const data = err.response?.data as
          | { message?: string; missingFields?: string[]; error?: { message?: string } }
          | undefined;

        if (data?.message) {
          setCalcError(data.message);
          if (Array.isArray(data.missingFields)) {
            setMissingFields(data.missingFields);
          }
          return;
        }

        if (data?.error?.message) {
          setCalcError(data.error.message);
          return;
        }
      }

      const message = err instanceof Error ? err.message : 'שגיאה בחישוב המחיר';
      setCalcError(message);
    } finally {
      setCalcLoading(false);
    }
  }, []);

  // Select item and do first calculation
  const handleSelectItem = useCallback((item: SearchItem) => {
    setSelectedItem(item);
    setSearchResults([]);
    setSearchQuery(item.nameHe || item.englishDescription || item.itemCode);
    setOverrides(EMPTY_OVERRIDES);
    calculate(item._id, EMPTY_OVERRIDES);
  }, [calculate]);

  // Override change - just update local state, NO auto-recalculation
  const handleOverrideChange = useCallback((field: keyof PricingOverrides, value: string) => {
    setOverrides(prev => {
      const updated = { ...prev, [field]: value };
      // If bankRate changes, auto-compute usdRate with margin
      if (field === 'bankRate' && value !== '') {
        const bankVal = parseFloat(value);
        const marginPct = result?.pricingChain.rateMarginPercent ?? 5;
        if (!isNaN(bankVal) && bankVal > 0) {
          updated.usdRate = (bankVal * (1 + marginPct / 100)).toFixed(4);
        }
      }
      return updated;
    });
  }, [result?.pricingChain.rateMarginPercent]);

  // Manual recalculate button
  const handleRecalculate = useCallback(() => {
    if (!selectedItem) return;
    calculate(selectedItem._id, overrides);
  }, [selectedItem, overrides, calculate]);

  // Reset to defaults
  const handleReset = useCallback(() => {
    setOverrides(EMPTY_OVERRIDES);
    if (selectedItem) {
      calculate(selectedItem._id, EMPTY_OVERRIDES);
    }
  }, [selectedItem, calculate]);

  const handleClearSelection = useCallback(() => {
    setSelectedItem(null);
    setResult(null);
    setSearchQuery('');
    setCalcError(null);
    setMissingFields([]);
    setOverrides(EMPTY_OVERRIDES);
  }, []);

  useEffect(() => {
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, []);

  return (
    <PricingModuleView
      searchQuery={searchQuery}
      searchResults={searchResults}
      searching={searching}
      selectedItem={selectedItem}
      result={result}
      calcLoading={calcLoading}
      calcError={calcError}
      missingFields={missingFields}
      overrides={overrides}
      onBack={onBack}
      onSearchChange={handleSearchChange}
      onSelectItem={handleSelectItem}
      onClearSelection={handleClearSelection}
      onOverrideChange={handleOverrideChange}
      onRecalculate={handleRecalculate}
      onReset={handleReset}
    />
  );
}
