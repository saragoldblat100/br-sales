import { useState, useCallback, useRef } from 'react';
import { pricingApi, type PricingCalcResult, type SearchItem } from '../api/pricing.api';
import { PricingOverrides, EMPTY_OVERRIDES } from '../ui/PricingModule';

export interface MultiSKURow {
  id: string;
  selectedItem: SearchItem;
  overrides: PricingOverrides;
  originalOverrides: PricingOverrides;
  result: PricingCalcResult | null;
  originalResult: PricingCalcResult | null;
  isLoading: boolean;
  error: string | null;
}

export function useMultiSKUPricing() {
  // Rows data
  const [rows, setRows] = useState<MultiSKURow[]>([]);
  const [addingRange, setAddingRange] = useState(false);

  // From SKU search
  const [fromQuery, setFromQuery] = useState('');
  const [fromResults, setFromResults] = useState<SearchItem[]>([]);
  const [fromSearching, setFromSearching] = useState(false);
  const [fromItem, setFromItem] = useState<SearchItem | null>(null);
  const [showFromDropdown, setShowFromDropdown] = useState(false);

  // To SKU search
  const [toQuery, setToQuery] = useState('');
  const [toResults, setToResults] = useState<SearchItem[]>([]);
  const [toSearching, setToSearching] = useState(false);
  const [toItem, setToItem] = useState<SearchItem | null>(null);
  const [showToDropdown, setShowToDropdown] = useState(false);

  // Debounce refs
  const fromDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const toDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Handle FROM SKU search with debounce
  const handleFromSearch = useCallback((query: string) => {
    setFromQuery(query);
    if (query.length < 2) {
      setFromResults([]);
      setShowFromDropdown(false);
      return;
    }

    if (fromDebounceRef.current) clearTimeout(fromDebounceRef.current);
    setFromSearching(true);

    fromDebounceRef.current = setTimeout(async () => {
      try {
        const items = await pricingApi.searchItems(query);
        setFromResults(items);
        setShowFromDropdown(true);
      } catch {
        setFromResults([]);
      } finally {
        setFromSearching(false);
      }
    }, 300);
  }, []);

  // Handle TO SKU search with debounce
  const handleToSearch = useCallback((query: string) => {
    setToQuery(query);
    if (query.length < 2) {
      setToResults([]);
      setShowToDropdown(false);
      return;
    }

    if (toDebounceRef.current) clearTimeout(toDebounceRef.current);
    setToSearching(true);

    toDebounceRef.current = setTimeout(async () => {
      try {
        const items = await pricingApi.searchItems(query);
        setToResults(items);
        setShowToDropdown(true);
      } catch {
        setToResults([]);
      } finally {
        setToSearching(false);
      }
    }, 300);
  }, []);

  // Select FROM item
  const handleSelectFrom = useCallback((item: SearchItem) => {
    setFromItem(item);
    setFromQuery(item.itemCode);
    setShowFromDropdown(false);
    setFromResults([]);
  }, []);

  // Select TO item
  const handleSelectTo = useCallback((item: SearchItem) => {
    setToItem(item);
    setToQuery(item.itemCode);
    setShowToDropdown(false);
    setToResults([]);
  }, []);

  // Add range of SKUs
  const handleAddRange = useCallback(async () => {
    if (!fromItem || !toItem) {
      console.warn('Both from and to items must be selected');
      return;
    }

    setAddingRange(true);
    try {
      // Search items starting from the fromItem code to get a range
      const searchResults = await pricingApi.searchItems(fromItem.itemCode);

      // Filter to get items in the range (from <= itemCode <= to)
      // Compare lexicographically/numerically
      const fromCode = fromItem.itemCode;
      const toCode = toItem.itemCode;
      const isReversed = fromCode > toCode;
      const minCode = isReversed ? toCode : fromCode;
      const maxCode = isReversed ? fromCode : toCode;

      let rangeItems = searchResults.filter(
        item => item.itemCode >= minCode && item.itemCode <= maxCode
      );

      // If no results in range, add both items at least
      if (rangeItems.length === 0) {
        rangeItems = [fromItem, toItem];
      }

      // Dedup: don't add items that are already in the rows
      const existingCodes = new Set(rows.map(r => r.selectedItem.itemCode));
      const newItems = rangeItems.filter(item => !existingCodes.has(item.itemCode));

      // Load full pricing data for each item
      const newRows: MultiSKURow[] = [];
      for (const item of newItems) {
        try {
          // Load full item data with empty params to get defaults
          const pricingResult = await pricingApi.calculatePrice(item._id, {});

          // Build original overrides from the pricing result
          const originalOv: PricingOverrides = {
            supplierPrice: pricingResult.pricingChain.supplierPricePerCarton.toString(),
            freight: pricingResult.pricingChain.freightCostPerCarton.toString(),
            margin: pricingResult.pricingChain.marginPercentage.toString(),
            usdRate: pricingResult.pricingChain.usdToIls.toString(),
            bankRate: '',
            boxCBM: pricingResult.pricingChain.boxCBM.toString(),
            qtyPerCarton: pricingResult.pricingChain.qtyPerCarton.toString(),
          };

          newRows.push({
            id: crypto.randomUUID(),
            selectedItem: item,
            overrides: { ...originalOv },
            originalOverrides: originalOv,
            result: pricingResult,
            originalResult: pricingResult,
            isLoading: false,
            error: null,
          });
        } catch (itemErr) {
          // If item data can't be loaded, still add it with empty overrides
          newRows.push({
            id: crypto.randomUUID(),
            selectedItem: item,
            overrides: EMPTY_OVERRIDES,
            originalOverrides: EMPTY_OVERRIDES,
            result: null,
            originalResult: null,
            isLoading: false,
            error: null,
          });
        }
      }

      setRows(prev => [...prev, ...newRows]);

      // Reset inputs
      setFromQuery('');
      setToQuery('');
      setFromItem(null);
      setToItem(null);
      setFromResults([]);
      setToResults([]);
    } catch (err) {
      console.error('Error adding range:', err);
    } finally {
      setAddingRange(false);
    }
  }, [fromItem, toItem, rows]);

  // Update override for a row
  const updateRowOverride = useCallback(
    (rowId: string, field: keyof PricingOverrides, value: string) => {
      setRows(prev =>
        prev.map(row =>
          row.id === rowId
            ? { ...row, overrides: { ...row.overrides, [field]: value } }
            : row
        )
      );
    },
    []
  );

  // Calculate for a specific row
  const calculateRow = useCallback(async (rowId: string) => {
    const row = rows.find(r => r.id === rowId);
    if (!row) return;

    try {
      // Set loading
      setRows(prev =>
        prev.map(r =>
          r.id === rowId ? { ...r, isLoading: true, error: null } : r
        )
      );

      // Build params from overrides (same pattern as PricingModule)
      const params: Record<string, number> = {};
      if (row.overrides.supplierPrice !== '')
        params.overrideSupplierPrice = parseFloat(row.overrides.supplierPrice);
      if (row.overrides.freight !== '')
        params.overrideFreight = parseFloat(row.overrides.freight);
      if (row.overrides.margin !== '')
        params.overrideMargin = parseFloat(row.overrides.margin);
      if (row.overrides.usdRate !== '')
        params.overrideUsdRate = parseFloat(row.overrides.usdRate);
      if (row.overrides.boxCBM !== '')
        params.overrideBoxCBM = parseFloat(row.overrides.boxCBM);
      if (row.overrides.qtyPerCarton !== '')
        params.overrideQtyPerCarton = parseFloat(row.overrides.qtyPerCarton);

      // Call API
      const result = await pricingApi.calculatePrice(row.selectedItem._id, params);

      // Update with result
      setRows(prev =>
        prev.map(r =>
          r.id === rowId
            ? { ...r, result, isLoading: false, error: null }
            : r
        )
      );
    } catch (err: unknown) {
      const axiosErr = err as any;
      const message =
        axiosErr?.response?.data?.message ||
        (err instanceof Error ? err.message : 'שגיאה בחישוב');

      setRows(prev =>
        prev.map(r =>
          r.id === rowId
            ? { ...r, isLoading: false, error: message }
            : r
        )
      );
    }
  }, [rows]);

  // Delete a row
  const deleteRow = useCallback((rowId: string) => {
    setRows(prev => prev.filter(r => r.id !== rowId));
  }, []);

  // Reset a row to original values
  const resetRow = useCallback((rowId: string) => {
    setRows(prev =>
      prev.map(r =>
        r.id === rowId
          ? {
              ...r,
              overrides: { ...r.originalOverrides },
              result: r.originalResult,
              error: null,
              isLoading: false,
            }
          : r
      )
    );
  }, []);

  // Cleanup debounce on unmount
  const cleanup = useCallback(() => {
    if (fromDebounceRef.current) clearTimeout(fromDebounceRef.current);
    if (toDebounceRef.current) clearTimeout(toDebounceRef.current);
  }, []);

  return {
    // Rows
    rows,
    deleteRow,
    resetRow,
    updateRowOverride,
    calculateRow,

    // From SKU
    fromQuery,
    setFromQuery: handleFromSearch,
    fromResults,
    fromSearching,
    fromItem,
    onSelectFrom: handleSelectFrom,
    showFromDropdown,
    setShowFromDropdown,

    // To SKU
    toQuery,
    setToQuery: handleToSearch,
    toResults,
    toSearching,
    toItem,
    onSelectTo: handleSelectTo,
    showToDropdown,
    setShowToDropdown,

    // Add range
    onAddRange: handleAddRange,
    addingRange,

    // Cleanup
    cleanup,
  };
}
