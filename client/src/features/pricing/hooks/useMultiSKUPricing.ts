import { useState, useCallback, useRef } from 'react';
import { pricingApi, type PricingCalcResult, type SearchItem, type PartialPricingResult } from '../api/pricing.api';
import { PricingOverrides, EMPTY_OVERRIDES } from '../ui/PricingModule';

export interface MultiSKURow {
  id: string;
  selectedItem: SearchItem;
  overrides: PricingOverrides;
  originalOverrides: PricingOverrides;
  result: PricingCalcResult | PartialPricingResult | null;
  originalResult: PricingCalcResult | PartialPricingResult | null;
  isLoading: boolean;
  error: string | null;
}

export function useMultiSKUPricing() {
  // Rows data
  const [rows, setRows] = useState<MultiSKURow[]>([]);
  const [addingRange, setAddingRange] = useState(false);

  // Container freight management
  const containerSizeCBM = 68;
  const [currentContainerFreight, setCurrentContainerFreight] = useState<number | null>(null);
  const [tempContainerFreight, setTempContainerFreight] = useState<number | null>(null);
  const [freightInput, setFreightInput] = useState('');
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const [feedbackType, setFeedbackType] = useState<'success' | 'error' | null>(null);

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
      // Get items in the range using backend range query
      const fromCode = fromItem.itemCode;
      const toCode = toItem.itemCode;
      const isReversed = fromCode > toCode;
      const minCode = isReversed ? toCode : fromCode;
      const maxCode = isReversed ? fromCode : toCode;

      const rangeItems = await pricingApi.getItemsInRange(minCode, maxCode);

      // If no results in range, add both items at least
      let itemsToAdd = rangeItems.length > 0 ? rangeItems : [fromItem, toItem];

      // Dedup within itemsToAdd first (important when from==to and both items are the same)
      const itemCodeSet = new Set<string>();
      const dedupedItemsToAdd = itemsToAdd.filter(item => {
        if (itemCodeSet.has(item.itemCode)) return false;
        itemCodeSet.add(item.itemCode);
        return true;
      });

      // Then dedup against existing rows
      const existingCodes = new Set(rows.map(r => r.selectedItem.itemCode));
      const newItems = dedupedItemsToAdd.filter(item => !existingCodes.has(item.itemCode));

      // Load full pricing data for each item
      const newRows: MultiSKURow[] = [];
      for (const item of newItems) {
        try {
          // Load full item data with empty params to get defaults
          const pricingResult = await pricingApi.calculatePrice(item._id, {});

          // Handle both full and partial results
          const isPartial = 'partial' in pricingResult && pricingResult.partial;
          const pricingChain = isPartial
            ? pricingResult.partialPricingChain
            : (pricingResult as any).pricingChain;

          // Capture current container freight on first load (only for full results)
          if (!isPartial && currentContainerFreight === null && 'freightCostPerContainer' in pricingChain) {
            setCurrentContainerFreight((pricingChain as any).freightCostPerContainer);
          }

          // Build original overrides from the pricing result
          const originalOv: PricingOverrides = {
            supplierPrice: pricingChain.supplierPricePerCarton.toString(),
            freight: pricingChain.freightCostPerCarton.toString(),
            margin: pricingChain.marginPercentage.toString(),
            usdRate: pricingChain.usdToIls.toString(),
            bankRate: '',
            boxCBM: pricingChain.boxCBM.toString(),
            qtyPerCarton: pricingChain.qtyPerCarton.toString(),
          };

          newRows.push({
            id: crypto.randomUUID(),
            selectedItem: item,
            overrides: { ...originalOv },
            originalOverrides: originalOv,
            result: pricingResult,
            originalResult: pricingResult,
            isLoading: false,
            error: null, // Partial results are expected, not errors
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
            error: 'שגיאה בטעינת נתוני הפריט',
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

      // Build params from overrides - only send if user actually changed the value
      const params: Record<string, number> = {};

      // Only send if user actually modified (differs from original)
      if (row.overrides.supplierPrice !== row.originalOverrides.supplierPrice && row.overrides.supplierPrice !== '') {
        params.overrideSupplierPrice = parseFloat(row.overrides.supplierPrice);
      }

      // Freight: check temporary override first, then user-modified value
      if (tempContainerFreight !== null) {
        params.overrideFreight = tempContainerFreight;
      } else if (row.overrides.freight !== row.originalOverrides.freight && row.overrides.freight !== '') {
        // User changed freight - convert per-carton to per-container
        const freightPerCartonNum = parseFloat(row.overrides.freight);
        const boxCBMNum = parseFloat(row.overrides.boxCBM || row.originalOverrides.boxCBM);
        if (boxCBMNum > 0 && !isNaN(freightPerCartonNum)) {
          const freightPerContainer = (freightPerCartonNum / boxCBMNum) * containerSizeCBM;
          params.overrideFreight = freightPerContainer;
        }
      }

      // Only send if user actually modified (differs from original)
      if (row.overrides.margin !== row.originalOverrides.margin && row.overrides.margin !== '') {
        params.overrideMargin = parseFloat(row.overrides.margin);
      }
      if (row.overrides.usdRate !== row.originalOverrides.usdRate && row.overrides.usdRate !== '') {
        params.overrideUsdRate = parseFloat(row.overrides.usdRate);
      }
      if (row.overrides.boxCBM !== row.originalOverrides.boxCBM && row.overrides.boxCBM !== '') {
        params.overrideBoxCBM = parseFloat(row.overrides.boxCBM);
      }
      if (row.overrides.qtyPerCarton !== row.originalOverrides.qtyPerCarton && row.overrides.qtyPerCarton !== '') {
        params.overrideQtyPerCarton = parseFloat(row.overrides.qtyPerCarton);
      }

      // Call API
      const result = await pricingApi.calculatePrice(row.selectedItem._id, params);

      // Result may be partial (expected business case when data is missing) - not an error

      // Update with result and sync freight display if temp freight was used
      setRows(prev =>
        prev.map(r => {
          if (r.id !== rowId) return r;

          // If tempContainerFreight was used, update displayed freight per-carton
          let updatedRow = { ...r, result, isLoading: false, error: null };

          if (tempContainerFreight !== null) {
            const boxCBMNum = parseFloat(r.overrides.boxCBM || r.originalOverrides.boxCBM);
            const freightPerCarton = (tempContainerFreight / containerSizeCBM) * boxCBMNum;
            updatedRow = {
              ...updatedRow,
              overrides: {
                ...updatedRow.overrides,
                freight: freightPerCarton.toFixed(3),
              },
            };
          }

          return updatedRow;
        })
      );
    } catch (err: unknown) {
      const axiosErr = err as any;

      // Expected 400 with partial data is not an error - silently return
      if (axiosErr?.response?.status === 400 && axiosErr?.response?.data?.partialPricingChain) {
        return;
      }

      // Only log and show real errors (network, 500, etc.)
      const message =
        axiosErr?.response?.data?.message ||
        (err instanceof Error ? err.message : 'שגיאה בחישוב');

      console.error('Pricing calculation error:', err);

      setRows(prev =>
        prev.map(r =>
          r.id === rowId
            ? { ...r, isLoading: false, error: message }
            : r
        )
      );
    }
  }, [rows, tempContainerFreight, containerSizeCBM]);

  // Delete a row
  const deleteRow = useCallback((rowId: string) => {
    setRows(prev => prev.filter(r => r.id !== rowId));
  }, []);

  // Reset a row to fresh system defaults from DB
  const resetRow = useCallback(async (rowId: string) => {
    const row = rows.find(r => r.id === rowId);
    if (!row) return;

    // Set loading state
    setRows(prev =>
      prev.map(r =>
        r.id === rowId ? { ...r, isLoading: true, error: null } : r
      )
    );

    try {
      // Fetch fresh data from DB with empty overrides
      const result = await pricingApi.calculatePrice(
        row.selectedItem._id,
        {}
      );

      // Build fresh overrides from pricingChain (system defaults)
      const pricingChain = 'partial' in result && result.partial
        ? result.partialPricingChain
        : (result as any).pricingChain;

      const freshOverrides: PricingOverrides = {
        supplierPrice: pricingChain.supplierPricePerCarton.toString(),
        freight: pricingChain.freightCostPerCarton.toString(),
        margin: pricingChain.marginPercentage.toString(),
        usdRate: pricingChain.usdToIls.toString(),
        bankRate: '',
        boxCBM: pricingChain.boxCBM.toString(),
        qtyPerCarton: pricingChain.qtyPerCarton.toString(),
      };

      // Update row with fresh data (partial results are expected business cases, not errors)
      setRows(prev =>
        prev.map(r =>
          r.id === rowId
            ? {
                ...r,
                overrides: freshOverrides,
                originalOverrides: freshOverrides,
                result: result,
                originalResult: result,
                isLoading: false,
                error: null,
              }
            : r
        )
      );

    } catch (err: unknown) {
      const axiosErr = err as any;

      // Expected 400 with partial data is not an error - silently return
      if (axiosErr?.response?.status === 400 && axiosErr?.response?.data?.partialPricingChain) {
        return;
      }

      // Only log and show real errors (network, 500, etc.)
      const errorMsg =
        axiosErr?.response?.data?.message ||
        (err instanceof Error ? err.message : 'שגיאה באיפוס השורה');

      console.error('Reset row error:', err);

      setRows(prev =>
        prev.map(r =>
          r.id === rowId
            ? {
                ...r,
                isLoading: false,
                error: errorMsg,
              }
            : r
        )
      );
    }
  }, [rows]);

  // Cleanup debounce on unmount
  const cleanup = useCallback(() => {
    if (fromDebounceRef.current) clearTimeout(fromDebounceRef.current);
    if (toDebounceRef.current) clearTimeout(toDebounceRef.current);
  }, []);

  // Apply temporary freight (affects next Calculate only)
  const applyTempFreight = useCallback(() => {
    const value = parseFloat(freightInput);
    if (!isNaN(value) && value >= 0) {
      setTempContainerFreight(value);
      setFeedbackMessage('הובלה זמנית יושמה');
      setFeedbackType('success');
      setTimeout(() => {
        setFeedbackMessage(null);
        setFeedbackType(null);
      }, 3000);
    }
  }, [freightInput]);

  // Apply global freight (saves to DB and recalculates all rows immediately)
  const applyGlobalFreight = useCallback(async () => {
    const value = parseFloat(freightInput);
    if (isNaN(value) || value < 0) return;

    // Show confirmation dialog
    const confirmed = window.confirm(`האם אתה בטוח שברצונך לעדכן את מחיר ההובלה ל-$${value.toFixed(2)}?`);
    if (!confirmed) {
      setFeedbackMessage('ביטול עדכון');
      setFeedbackType('error');
      setTimeout(() => {
        setFeedbackMessage(null);
        setFeedbackType(null);
      }, 2000);
      return;
    }

    try {
      await pricingApi.updateFreightRate({
        freightCost: value,
        containerSizeCBM: 68,
        portOfOrigin: 'Shenzhen Yantian',
      });

      setCurrentContainerFreight(value);
      setTempContainerFreight(null);
      setFreightInput('');
      setFeedbackMessage('הובלה עודכנה בהצלחה');
      setFeedbackType('success');
      setTimeout(() => {
        setFeedbackMessage(null);
        setFeedbackType(null);
      }, 3000);

      // Recalculate all rows with new container freight
      const updatedRows = rows.map(r => {
        // Calculate new freight per carton based on new container freight and current boxCBM
        const boxCBMNum = parseFloat(r.overrides.boxCBM || r.originalOverrides.boxCBM);
        const newFreightPerCarton = (value / containerSizeCBM) * boxCBMNum;

        return {
          ...r,
          overrides: {
            ...r.overrides,
            freight: newFreightPerCarton.toFixed(3),
          },
          isLoading: true,
        };
      });

      setRows(updatedRows);

      // Recalculate each row in parallel
      const recalcPromises = updatedRows.map(async (r) => {
        try {
          const params: Record<string, number> = {};
          params.overrideFreight = value; // Use new container freight

          // Add any user-modified overrides (that differ from original)
          if (r.overrides.supplierPrice !== r.originalOverrides.supplierPrice && r.overrides.supplierPrice !== '') {
            params.overrideSupplierPrice = parseFloat(r.overrides.supplierPrice);
          }
          if (r.overrides.margin !== r.originalOverrides.margin && r.overrides.margin !== '') {
            params.overrideMargin = parseFloat(r.overrides.margin);
          }
          if (r.overrides.usdRate !== r.originalOverrides.usdRate && r.overrides.usdRate !== '') {
            params.overrideUsdRate = parseFloat(r.overrides.usdRate);
          }
          if (r.overrides.boxCBM !== r.originalOverrides.boxCBM && r.overrides.boxCBM !== '') {
            params.overrideBoxCBM = parseFloat(r.overrides.boxCBM);
          }
          if (r.overrides.qtyPerCarton !== r.originalOverrides.qtyPerCarton && r.overrides.qtyPerCarton !== '') {
            params.overrideQtyPerCarton = parseFloat(r.overrides.qtyPerCarton);
          }

          const result = await pricingApi.calculatePrice(r.selectedItem._id, params);

          return { rowId: r.id, result, error: null };
        } catch (err: unknown) {
          const axiosErr = err as any;
          const message = axiosErr?.response?.data?.message || (err instanceof Error ? err.message : 'שגיאה בחישוב');
          return { rowId: r.id, result: null, error: message };
        }
      });

      const results = await Promise.all(recalcPromises);

      // Update rows with recalculated results
      setRows(prev =>
        prev.map(r => {
          const recalcResult = results.find(res => res.rowId === r.id);
          if (!recalcResult) return r;

          return {
            ...r,
            result: recalcResult.result,
            error: recalcResult.error,
            isLoading: false,
          };
        })
      );
    } catch (error) {
      console.error('Failed to update freight rate:', error);
      setFeedbackMessage('שגיאה בעדכון הובלה');
      setFeedbackType('error');
      setTimeout(() => {
        setFeedbackMessage(null);
        setFeedbackType(null);
      }, 3000);
    }
  }, [freightInput, containerSizeCBM, rows]);

  return {
    // Rows
    rows,
    deleteRow,
    resetRow,
    updateRowOverride,
    calculateRow,

    // Container freight
    currentContainerFreight,
    freightInput,
    setFreightInput,
    applyTempFreight,
    applyGlobalFreight,
    feedbackMessage,
    feedbackType,

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
