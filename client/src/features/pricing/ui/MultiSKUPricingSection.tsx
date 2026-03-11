import { Loader2, Trash2, Calculator, Search, RotateCcw } from 'lucide-react';
import type { MultiSKURow } from '../hooks/useMultiSKUPricing';
import type { SearchItem } from '../api/pricing.api';
import type { PricingOverrides } from './PricingModule';

interface MultiSKUPricingSectionProps {
  rows: MultiSKURow[];
  fromQuery: string;
  toQuery: string;
  fromResults: SearchItem[];
  toResults: SearchItem[];
  fromSearching: boolean;
  toSearching: boolean;
  fromItem: SearchItem | null;
  toItem: SearchItem | null;
  showFromDropdown: boolean;
  showToDropdown: boolean;
  onSetFromQuery: (q: string) => void;
  onSetToQuery: (q: string) => void;
  onSelectFrom: (item: SearchItem) => void;
  onSelectTo: (item: SearchItem) => void;
  onSetShowFromDropdown: (show: boolean) => void;
  onSetShowToDropdown: (show: boolean) => void;
  onAddRange: () => void;
  onOverrideChange: (rowId: string, field: keyof PricingOverrides, value: string) => void;
  onCalculateRow: (rowId: string) => void;
  onResetRow: (rowId: string) => void;
  onDeleteRow: (rowId: string) => void;
}

export function MultiSKUPricingSection({
  rows,
  fromQuery,
  toQuery,
  fromResults,
  toResults,
  fromSearching,
  toSearching,
  fromItem,
  toItem,
  showFromDropdown,
  showToDropdown,
  onSetFromQuery,
  onSetToQuery,
  onSelectFrom,
  onSelectTo,
  onSetShowFromDropdown,
  onSetShowToDropdown,
  onAddRange,
  onOverrideChange,
  onCalculateRow,
  onResetRow,
  onDeleteRow,
}: MultiSKUPricingSectionProps) {
  return (
    <div className="space-y-6 mt-8">
      {/* Divider */}
      <div className="border-t border-gray-200 pt-6">
        <h2 className="text-lg font-bold text-gray-800 mb-4">חישוב מרובה פריטים</h2>

        {/* Range Selector - Compact Toolbar */}
        <div className=" rounded-lg shadow-sm p-4 border border-gray-100 mb-6">
          {/* Filter Controls Row */}
          <div className="flex items-end gap-3 flex-wrap">
            {/* FROM SKU */}
            <div className="relative flex-1 min-w-48">
              <label className="block text-xs font-semibold text-gray-600 mb-1.5"> ממק"ט </label>
              <div className="relative">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  value={fromQuery}
                  onChange={(e) => onSetFromQuery(e.target.value)}
                  onFocus={() => fromQuery.length >= 2 && onSetShowFromDropdown(true)}
                  onBlur={() => setTimeout(() => onSetShowFromDropdown(false), 200)}
                  placeholder=" בחר מקט להתחלה ..."
                  className="w-full pr-9 pl-3 py-1.5 border border-gray-300 rounded-lg text-sm bg-white focus:ring-1 focus:ring-blue-400 focus:border-blue-400 transition-colors"
                />
                {fromSearching && (
                  <Loader2 className="absolute left-3 top-1/2 -translate-y-1/2 h-3 w-3 animate-spin text-blue-500" />
                )}
              </div>

              {/* FROM Dropdown */}
              {showFromDropdown && fromResults.length > 0 && (
                <div className="absolute z-30 top-full mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-md max-h-40 overflow-y-auto">
                  {fromResults.map((item) => (
                    <button
                      key={item._id}
                      onClick={() => onSelectFrom(item)}
                      className="w-full text-right px-3 py-1.5 hover:bg-blue-50 border-b border-gray-100 last:border-0 transition-colors text-xs"
                    >
                      <div className="font-medium text-gray-900">{item.itemCode}</div>
                      <div className="text-[11px] text-gray-500">{item.nameHe || item.englishDescription}</div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* TO SKU */}
            <div className="relative flex-1 min-w-48">
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">עד מק"ט </label>
              <div className="relative">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  value={toQuery}
                  onChange={(e) => onSetToQuery(e.target.value)}
                  onFocus={() => toQuery.length >= 2 && onSetShowToDropdown(true)}
                  onBlur={() => setTimeout(() => onSetShowToDropdown(false), 200)}
                  placeholder=" בחר מקט לסיום ..."
                  className="w-full pr-9 pl-3 py-1.5 border border-gray-300 rounded-lg text-sm bg-white focus:ring-1 focus:ring-blue-400 focus:border-blue-400 transition-colors"
                />
                {toSearching && (
                  <Loader2 className="absolute left-3 top-1/2 -translate-y-1/2 h-3 w-3 animate-spin text-blue-500" />
                )}
              </div>

              {/* TO Dropdown */}
              {showToDropdown && toResults.length > 0 && (
                <div className="absolute z-30 top-full mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-md max-h-40 overflow-y-auto">
                  {toResults.map((item) => (
                    <button
                      key={item._id}
                      onClick={() => onSelectTo(item)}
                      className="w-full text-right px-3 py-1.5 hover:bg-blue-50 border-b border-gray-100 last:border-0 transition-colors text-xs"
                    >
                      <div className="font-medium text-gray-900">{item.itemCode}</div>
                      <div className="text-[11px] text-gray-500">{item.nameHe || item.englishDescription}</div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Action Button - Secondary Style */}
            <button
              onClick={onAddRange}
              disabled={!fromItem || !toItem}
              className="px-4 py-1.5 bg-gray-100 hover:bg-gray-200 disabled:bg-gray-50 disabled:text-gray-400 text-gray-700 border border-gray-300 rounded-lg text-sm font-medium transition-all"
            >
              הצג טבלה 
            </button>
          </div>
        </div>

        {/* Table Section */}
        {rows.length > 0 && (
          <div className="rounded-2xl shadow-md overflow-hidden border border-gray-200">
            <div className="overflow-x-auto">
              <table className="w-full bg-white">
                {/* Header */}
                <thead className="bg-gray-50 sticky top-0 z-10 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-right text-xs font-bold text-gray-700 whitespace-nowrap">
                      מק״ט
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-bold text-gray-700 whitespace-nowrap">
                      תאור פריט
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-bold text-gray-700 whitespace-nowrap">
                      מחיר ספק
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-bold text-gray-700 whitespace-nowrap">
                      הובלה
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-bold text-gray-700 whitespace-nowrap">
                      רווח %
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-bold text-gray-700 whitespace-nowrap">
                      שער + מרווח
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-bold text-gray-700 whitespace-nowrap">
                      CBM
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-bold text-gray-700 whitespace-nowrap">
                      יח׳ / קרטון
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-bold text-gray-700 whitespace-nowrap">
                      מ.קרטון ($)
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-bold text-gray-700 whitespace-nowrap">
                      מ.יחידה ($)
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-bold text-gray-700 whitespace-nowrap">
                      פעולות
                    </th>
                  </tr>
                </thead>

                {/* Body */}
                <tbody>
                  {rows.map((row, idx) => (
                    <tr
                      key={row.id}
                      className={`border-b border-gray-100 hover:bg-blue-50/50 transition-colors ${
                        idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'
                      }`}
                    >
                      {/* SKU */}
                      <td className="px-4 py-3 text-sm font-bold text-gray-900 whitespace-nowrap">
                        {row.selectedItem.itemCode}
                      </td>

                      {/* Description */}
                      <td className="px-4 py-3 text-sm text-gray-600 max-w-xs truncate">
                        {row.selectedItem.nameHe || row.selectedItem.englishDescription}
                      </td>

                      {/* Supplier Price - Editable */}
                      <td className="px-4 py-3">
                        <input
                          type="number"
                          step="0.01"
                          value={row.overrides.supplierPrice}
                          onChange={(e) => onOverrideChange(row.id, 'supplierPrice', e.target.value)}
                          placeholder="$"
                          className="w-20 px-2 py-1 border border-gray-300 rounded-lg text-xs focus:ring-1 focus:ring-blue-400 focus:border-blue-400"
                        />
                      </td>

                      {/* Freight - Editable */}
                      <td className="px-4 py-3">
                        <input
                          type="number"
                          step="0.01"
                          value={row.overrides.freight}
                          onChange={(e) => onOverrideChange(row.id, 'freight', e.target.value)}
                          placeholder="$"
                          className="w-20 px-2 py-1 border border-gray-300 rounded-lg text-xs focus:ring-1 focus:ring-blue-400 focus:border-blue-400"
                        />
                      </td>

                      {/* Margin % - Editable */}
                      <td className="px-4 py-3">
                        <input
                          type="number"
                          step="0.1"
                          value={row.overrides.margin}
                          onChange={(e) => onOverrideChange(row.id, 'margin', e.target.value)}
                          placeholder="%"
                          className="w-20 px-2 py-1 border border-gray-300 rounded-lg text-xs focus:ring-1 focus:ring-blue-400 focus:border-blue-400"
                        />
                      </td>

                      {/* USD Rate - Editable */}
                      <td className="px-4 py-3">
                        <input
                          type="number"
                          step="0.0001"
                          value={row.overrides.usdRate}
                          onChange={(e) => onOverrideChange(row.id, 'usdRate', e.target.value)}
                          placeholder="₪"
                          className="w-24 px-2 py-1 border border-gray-300 rounded-lg text-xs focus:ring-1 focus:ring-blue-400 focus:border-blue-400"
                        />
                      </td>

                      {/* CBM - Editable */}
                      <td className="px-4 py-3">
                        <input
                          type="number"
                          step="0.01"
                          value={row.overrides.boxCBM}
                          onChange={(e) => onOverrideChange(row.id, 'boxCBM', e.target.value)}
                          className="w-16 px-2 py-1 border border-gray-300 rounded-lg text-xs focus:ring-1 focus:ring-blue-400 focus:border-blue-400"
                        />
                      </td>

                      {/* Units per Carton - Editable */}
                      <td className="px-4 py-3">
                        <input
                          type="number"
                          step="1"
                          value={row.overrides.qtyPerCarton}
                          onChange={(e) => onOverrideChange(row.id, 'qtyPerCarton', e.target.value)}
                          className="w-16 px-2 py-1 border border-gray-300 rounded-lg text-xs focus:ring-1 focus:ring-blue-400 focus:border-blue-400"
                        />
                      </td>

                      {/* Carton Price - Result */}
                      <td className="px-4 py-3 text-sm font-bold text-orange-600 whitespace-nowrap">
                        ${row.result?.pricingChain.calculatedPricePerCartonUSD.toFixed(2) || '—'}
                      </td>

                      {/* Unit Price - Result */}
                      <td className="px-4 py-3 text-sm font-bold text-orange-600 whitespace-nowrap">
                        ${row.result?.pricingChain.calculatedPricePerUnitUSD.toFixed(2) || '—'}
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3 flex gap-1 whitespace-nowrap">
                        <button
                          onClick={() => onCalculateRow(row.id)}
                          disabled={row.isLoading}
                          className="px-3 py-1 bg-blue-600 text-white text-xs rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-all font-medium flex items-center gap-1"
                        >
                          {row.isLoading ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <Calculator className="h-3 w-3" />
                          )}
                          חשב
                        </button>
                        <button
                          onClick={() => onResetRow(row.id)}
                          className="px-3 py-1 bg-amber-500 text-white text-xs rounded-lg hover:bg-amber-600 transition-all font-medium flex items-center gap-1"
                          title="איפוס לערכים המקוריים"
                        >
                          <RotateCcw className="h-3 w-3" />
                        </button>
                        <button
                          onClick={() => onDeleteRow(row.id)}
                          className="px-3 py-1 bg-red-500 text-white text-xs rounded-lg hover:bg-red-600 transition-all font-medium flex items-center gap-1"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Error display per row */}
            {rows.some(r => r.error) && (
              <div className="px-4 py-3 bg-red-50 border-t border-red-100">
                {rows
                  .filter(r => r.error)
                  .map(r => (
                    <div key={r.id} className="text-xs text-red-600 mb-1">
                      {r.selectedItem.itemCode}: {r.error}
                    </div>
                  ))}
              </div>
            )}
          </div>
        )}

        {/* Empty state */}
        {rows.length === 0 && (
          
          <div className="text-center py-12 text-gray-400">
            <Search className="h-6 w-6 mx-auto mb-4 opacity-50" />
            <p className="text-sm font-medium">בחרו מקט או טווח מקטים לתצוגת חישוב מחיר</p>
          </div>
        )}
            
      </div>
    </div>
  );
}
