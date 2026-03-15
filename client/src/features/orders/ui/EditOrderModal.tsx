import { useState, useMemo, useCallback, useEffect } from 'react';
import { X, Trash2, Search } from 'lucide-react';
import type { OrderItem, OrderLine } from '../api';
import type { SalesItem } from '@bravo/shared';
import { useUpdateOrderLines } from '../api/orders.queries';
import { searchItemsByCode, calculateItemPrice } from '@/features/items/api/items.api';

interface EditLine {
  itemId: string;
  itemCode: string;
  description: string;
  cartons: number;
  qtyPerCarton: number;
  pricePerCarton: number;
  pricePerUnit: number;
  currency: 'ILS' | 'USD';
  boxCBM: number;
}

interface EditOrderModalProps {
  order: OrderItem;
  onClose: () => void;
  onSaved: () => void;
}

export function EditOrderModal({ order, onClose, onSaved }: EditOrderModalProps) {
  const [lines, setLines] = useState<EditLine[]>(() =>
    order.lines.map((line: OrderLine) => ({
      itemId: line.itemId,
      itemCode: line.itemCode,
      description: line.description,
      cartons: line.cartons,
      qtyPerCarton: (line.quantity / line.cartons) || 1,
      pricePerCarton: line.pricePerCarton,
      pricePerUnit: line.pricePerUnit,
      currency: (line.currency as 'ILS' | 'USD') || 'ILS',
      boxCBM: (line.cbm / line.cartons) || 1,
    }))
  );

  const [notes, setNotes] = useState(order.notes || '');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SalesItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<SalesItem | null>(null);
  const [addCartons, setAddCartons] = useState<number>(1);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [priceError, setPriceError] = useState<string | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateMutation = useUpdateOrderLines();

  // Search items when query changes
  useEffect(() => {
    if (searchQuery.length < 2) {
      setSearchResults([]);
      setSearchError(null);
      return;
    }

    const performSearch = async () => {
      try {
        setSearchError(null);
        const result = await searchItemsByCode(searchQuery, order.customerCode);
        setSearchResults(result.items || []);
      } catch (err) {
        setSearchError('שגיאה בחיפוש פריטים');
        setSearchResults([]);
      }
    };

    const timer = setTimeout(performSearch, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, order.customerCode]);

  // Compute totals
  const totals = useMemo(() => {
    return {
      cbm: lines.reduce((sum, line) => sum + line.cartons * line.boxCBM, 0),
      ils: lines
        .filter((line) => line.currency === 'ILS')
        .reduce((sum, line) => sum + line.cartons * line.pricePerCarton, 0),
      usd: lines
        .filter((line) => line.currency === 'USD')
        .reduce((sum, line) => sum + line.cartons * line.pricePerCarton, 0),
    };
  }, [lines]);

  // Handle update cartons
  const handleUpdateCartons = useCallback(
    (index: number, cartons: number) => {
      if (cartons < 1) return;
      const newLines = [...lines];
      newLines[index].cartons = cartons;
      setLines(newLines);
      setIsDirty(true);
    },
    [lines]
  );

  // Handle delete line
  const handleDeleteLine = useCallback((index: number) => {
    setLines((prev) => prev.filter((_, i) => i !== index));
    setIsDirty(true);
  }, []);

  // Handle select item from search
  const handleSelectItem = (item: SalesItem) => {
    setSelectedItem(item);
    setSearchQuery('');
    setSearchResults([]);
    setPriceError(null);
  };

  // Handle add item
  const handleAddItem = async () => {
    if (!selectedItem) return;

    try {
      setPriceError(null);
      const quantity = addCartons * (selectedItem.qtyPerCarton || 1);

      // Calculate price using the same endpoint as sales flow
      const pricingResponse = await calculateItemPrice({
        itemId: selectedItem._id,
        customerCode: order.customerCode,
        quantity,
      });

      const pricing = pricingResponse.pricing;

      // Check if item already exists in lines
      const existingIndex = lines.findIndex((l) => l.itemId === selectedItem._id);

      // Determine currency and pricing
      const pricePerCarton =
        (pricing.sellingPricePerCartonILS ?? 0) > 0
          ? pricing.sellingPricePerCartonILS!
          : pricing.sellingPricePerCartonUSD!;
      const pricePerUnit =
        (pricing.sellingPricePerUnitILS ?? 0) > 0
          ? pricing.sellingPricePerUnitILS!
          : pricing.sellingPricePerUnitUSD!;
      const currency = (pricing.sellingPricePerCartonILS ?? 0) > 0 ? 'ILS' : 'USD';

      const newLine: EditLine = {
        itemId: selectedItem._id,
        itemCode: selectedItem.itemCode,
        description: selectedItem.nameHe || selectedItem.englishDescription || '',
        cartons: addCartons,
        qtyPerCarton: selectedItem.qtyPerCarton || 1,
        pricePerCarton,
        pricePerUnit,
        currency: currency as 'ILS' | 'USD',
        boxCBM: selectedItem.boxCBM || 0,
      };

      if (existingIndex >= 0) {
        // Merge: increase cartons
        const newLines = [...lines];
        newLines[existingIndex].cartons += addCartons;
        setLines(newLines);
      } else {
        // Add new line
        setLines([...lines, newLine]);
      }

      setSelectedItem(null);
      setAddCartons(1);
      setIsDirty(true);
    } catch (err) {
      setPriceError('שגיאה בחישוב המחיר');
    }
  };

  // Handle save
  const handleSave = async (sendEmail: boolean) => {
    if (lines.length === 0) {
      setError('ההזמנה לא יכולה להיות ריקה');
      return;
    }

    try {
      setError(null);

      // Convert EditLine back to OrderLine format
      const orderLines: OrderLine[] = lines.map((line) => ({
        itemId: line.itemId,
        itemCode: line.itemCode,
        description: line.description,
        cartons: line.cartons,
        quantity: line.cartons * line.qtyPerCarton,
        pricePerUnit: line.pricePerUnit,
        pricePerCarton: line.pricePerCarton,
        totalPrice: line.cartons * line.pricePerCarton,
        currency: line.currency,
        cbm: line.cartons * line.boxCBM,
      }));

      await updateMutation.mutateAsync({
        orderId: order._id,
        data: {
          lines: orderLines,
          notes: notes || undefined,
          sendEmail,
        },
      });

      onSaved();
    } catch (err: any) {
      setError(err.response?.data?.message || 'שגיאה בשמירת ההזמנה');
    }
  };

  // Handle close with unsaved changes check
  const handleClose = () => {
    if (isDirty) {
      if (window.confirm('יש לך שינויים שלא נשמרו. האם אתה בטוח שברצונך לסגור?')) {
        onClose();
      }
    } else {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" dir="rtl">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">עריכת הזמנה {order.orderNumber}</h2>
          <button
            onClick={handleClose}
            className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X className="w-6 h-6 text-gray-600" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Error banner */}
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
              {error}
            </div>
          )}

          {/* Existing lines */}
          <div>
            <h3 className="text-lg font-bold text-gray-900 mb-3">פריטים בהזמנה</h3>
            <div className="space-y-2">
              {lines.map((line, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200"
                >
                  <div className="flex-1">
                    <div className="font-bold text-gray-900">{line.itemCode}</div>
                    <div className="text-sm text-gray-600">{line.description}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="1"
                      value={line.cartons}
                      onChange={(e) => handleUpdateCartons(idx, parseInt(e.target.value) || 1)}
                      className="w-16 h-9 px-2 py-1 border border-gray-300 rounded text-sm text-center"
                    />
                    <span className="text-xs text-gray-500 w-12">קרטונים</span>
                  </div>
                  <div className="text-right min-w-24">
                    <div className="text-sm font-bold text-gray-900">
                      {line.cartons * line.qtyPerCarton} יח׳
                    </div>
                    <div className="text-xs text-gray-500">
                      {line.currency === 'ILS' ? '₪' : '$'}
                      {(line.cartons * line.pricePerCarton).toFixed(0)}
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeleteLine(idx)}
                    className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-red-50 transition-colors"
                  >
                    <Trash2 className="w-4 h-4 text-red-600" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Add new item */}
          <div className="border-t pt-6">
            <h3 className="text-lg font-bold text-gray-900 mb-3">הוסף פריט חדש</h3>
            <div className="space-y-3">
              {/* Search input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">חיפוש לפי מק"ט או שם פריט</label>
                <div className="relative">
                  <Search className="absolute right-3 top-2.5 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="הקלד מקט או שם (לפחות 2 תווים)..."
                    className="w-full h-10 pr-10 pl-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                {searchError && <div className="mt-1 text-sm text-red-600">{searchError}</div>}
              </div>

              {/* Search results dropdown */}
              {searchResults.length > 0 && (
                <div className="border border-gray-300 rounded-lg max-h-40 overflow-y-auto">
                  {searchResults.map((item) => (
                    <button
                      key={item._id}
                      onClick={() => handleSelectItem(item)}
                      className="w-full text-right p-3 hover:bg-blue-50 border-b border-gray-200 last:border-b-0 transition-colors"
                    >
                      <div className="font-bold text-gray-900">{item.itemCode}</div>
                      <div className="text-xs text-gray-600">{item.nameHe}</div>
                    </button>
                  ))}
                </div>
              )}

              {/* Selected item and cartons */}
              {selectedItem && !searchQuery && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg space-y-2">
                  <div>
                    <div className="font-bold text-gray-900">{selectedItem.itemCode}</div>
                    <div className="text-sm text-gray-600">{selectedItem.nameHe}</div>
                  </div>
                  <div className="flex gap-2 items-end">
                    <div className="flex-1">
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        כמות קרטונים
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={addCartons}
                        onChange={(e) => setAddCartons(Math.max(1, parseInt(e.target.value) || 1))}
                        className="w-full h-9 px-2 py-1 border border-gray-300 rounded text-sm"
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setSelectedItem(null)}
                        className="px-3 h-9 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        ביטול
                      </button>
                      <button
                        onClick={handleAddItem}
                        disabled={updateMutation.isPending}
                        className="px-4 h-9 rounded-lg bg-blue-600 text-white text-sm font-bold hover:bg-blue-700 transition-colors disabled:opacity-50"
                      >
                        הוסף
                      </button>
                    </div>
                  </div>
                  {priceError && <div className="text-xs text-red-600">{priceError}</div>}
                </div>
              )}
            </div>
          </div>

          {/* Totals */}
          <div className="border-t pt-4 bg-gray-50 rounded-lg p-4">
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">סה"כ CBM:</span>
                <span className="font-bold text-gray-900">{totals.cbm.toFixed(2)}</span>
              </div>
              {totals.ils > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-600">סה"כ (₪):</span>
                  <span className="font-bold text-gray-900">₪{totals.ils.toFixed(0)}</span>
                </div>
              )}
              {totals.usd > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-600">סה"כ ($):</span>
                  <span className="font-bold text-gray-900">${totals.usd.toFixed(0)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Notes */}
          <div className="border-t pt-6">
            <h3 className="text-lg font-bold text-gray-900 mb-3">הערות</h3>
            <textarea
              value={notes}
              onChange={(e) => {
                setNotes(e.target.value);
                setIsDirty(true);
              }}
              placeholder="הוסף הערות להזמנה..."
              className="w-full h-24 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>
        </div>

        {/* Footer actions */}
        <div className="border-t border-gray-200 p-6 bg-gray-50 flex gap-3 justify-end">
          <button
            onClick={handleClose}
            disabled={updateMutation.isPending}
            className="px-6 h-10 rounded-lg border border-gray-300 text-gray-700 font-medium hover:bg-gray-100 transition-colors disabled:opacity-50"
          >
            ביטול
          </button>
          <button
            onClick={() => handleSave(false)}
            disabled={updateMutation.isPending}
            className="px-6 h-10 rounded-lg border border-gray-300 text-gray-700 font-medium hover:bg-gray-100 transition-colors disabled:opacity-50"
          >
            שמור ללא מייל
          </button>
          <button
            onClick={() => handleSave(true)}
            disabled={updateMutation.isPending}
            className="px-6 h-10 rounded-lg bg-red-600 text-white font-medium hover:bg-red-700 transition-colors disabled:opacity-50"
          >
            {updateMutation.isPending ? 'שומר...' : 'שמור ושלח מייל'}
          </button>
        </div>
      </div>
    </div>
  );
}
