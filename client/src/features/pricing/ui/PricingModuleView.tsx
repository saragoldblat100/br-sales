import { ArrowRight, Search, Loader2, X, AlertTriangle, Calculator } from 'lucide-react';
import type { PricingCalcResult, SearchItem } from '../api/pricing.api';
import type { PricingOverrides } from './PricingModule';
import { MultiSKUPricingSection } from './MultiSKUPricingSection';
import type { MultiSKURow } from '../hooks/useMultiSKUPricing';

interface MultiSKUProps {
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
  addingRange: boolean;
  onOverrideChange: (rowId: string, field: keyof PricingOverrides, value: string) => void;
  onCalculateRow: (rowId: string) => void;
  onResetRow: (rowId: string) => void;
  onDeleteRow: (rowId: string) => void;
}

interface PricingModuleViewProps {
  searchQuery: string;
  searchResults: SearchItem[];
  searching: boolean;
  selectedItem: SearchItem | null;
  result: PricingCalcResult | null;
  calcLoading: boolean;
  calcError: string | null;
  missingFields: string[];
  overrides: PricingOverrides;
  onBack: () => void;
  onSearchChange: (query: string) => void;
  onSelectItem: (item: SearchItem) => void;
  onClearSelection: () => void;
  onOverrideChange: (field: keyof PricingOverrides, value: string) => void;
  onRecalculate: () => void;
  onReset: () => void;
  multiSKUProps: MultiSKUProps;
}

export function PricingModuleView({
  searchQuery,
  searchResults,
  searching,
  selectedItem,
  result,
  calcLoading,
  calcError,
  missingFields,
  overrides,
  onBack,
  onSearchChange,
  onSelectItem,
  onClearSelection,
  onOverrideChange,
  onRecalculate,
  onReset,
  multiSKUProps,
}: PricingModuleViewProps) {
  const chain = result?.pricingChain;
  const item = result?.item;

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-100 via-blue-50 to-gray-100 p-6 flex flex-col" dir="rtl">
      {/* Back button */}
      <button
        onClick={onBack}
        className="absolute top-6 right-6 flex items-center gap-2 px-4 py-2 bg-white hover:bg-gray-50 rounded-xl text-gray-700 transition-all shadow-lg"
      >
        <ArrowRight className="w-5 h-5" />
        <span className="font-medium">חזרה</span>
      </button>

      <div className="max-w-5xl mx-auto pt-8 flex-1">
        {/* Logo */}
        <div className="text-center mb-6">
          <img src="/logoBravo.svg" alt="Bravo Logo" className="h-20 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-800">מחשבון תמחור</h1>
        </div>

        {/* Single Item Section */}
        <h2 className="text-lg font-bold text-gray-800 mb-4">חישוב מחיר לפריט יחיד</h2>

        {/* Search */}
        <div className="relative max-w-lg mx-auto mb-8">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="חפש פריט לפי שם או מק״ט..."
              className="w-full pr-10 pl-10 py-3 border border-gray-300 rounded-xl text-sm bg-white shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            {selectedItem && (
              <button
                onClick={onClearSelection}
                className="absolute left-3 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 rounded-full"
              >
                <X className="h-4 w-4 text-gray-400" />
              </button>
            )}
            {searching && (
              <Loader2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-blue-500" />
            )}
          </div>

          {/* Search results dropdown */}
          {searchResults.length > 0 && !selectedItem && (
            <div className="absolute z-30 top-full mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg max-h-60 overflow-y-auto">
              {searchResults.map((si) => (
                <button
                  key={si._id}
                  onClick={() => onSelectItem(si)}
                  className="w-full text-right px-4 py-3 hover:bg-blue-50 border-b border-gray-50 last:border-0 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    {si.imageUrl && (
                      <img src={si.imageUrl} alt="" className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
                    )}
                    <div>
                      <div className="font-medium text-gray-900 text-sm">{si.nameHe || si.englishDescription}</div>
                      <div className="text-xs text-gray-500">{si.itemCode}</div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Errors */}
        {missingFields.length > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 max-w-lg mx-auto">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              <span className="font-bold text-amber-700 text-sm">{calcError}</span>
            </div>
            <ul className="list-disc list-inside text-sm text-amber-600 space-y-1">
              {missingFields.map((f) => <li key={f}>{f}</li>)}
            </ul>
          </div>
        )}
        {calcError && missingFields.length === 0 && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 text-red-700 text-sm max-w-lg mx-auto">
            {calcError}
          </div>
        )}

        {/* Initial loading (first calc only - doesn't cover content on recalc) */}
        {calcLoading && !result && (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
          </div>
        )}

        {/* ========== PRICING RESULT ========== */}
        {chain && item && (
          <div className="space-y-6">

            {/* Row 1: Item Info */}
            <div className="bg-white rounded-2xl shadow-md p-4 flex items-center gap-6 flex-wrap">
              {item.imageUrl && (
                <img src={item.imageUrl} alt="" className="w-16 h-16 rounded-xl object-cover flex-shrink-0" />
              )}
              <div className="flex items-center gap-8 flex-wrap text-sm">
                <div>
                  <span className="text-gray-400 text-xs">מק״ט</span>
                  <div className="font-bold text-gray-900">{item.itemCode}</div>
                </div>
                <div>
                  <span className="text-gray-400 text-xs">תאור פריט</span>
                  <div className="font-bold text-gray-900">{item.nameHe || item.englishDescription}</div>
                </div>
                <div>
                  <span className="text-gray-400 text-xs">CBM לקרטון</span>
                  <div className="font-bold text-gray-900">{chain.boxCBM}</div>
                </div>
                <div>
                  <span className="text-gray-400 text-xs">יחידות בקרטון</span>
                  <div className="font-bold text-gray-900">{chain.qtyPerCarton}</div>
                </div>
              </div>
            </div>

            {/* Row 2: Base Data (Editable Inputs) + Calculate Button */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-gray-600">נתוני בסיס</h3>
                <div className="flex items-center gap-2">
                  <button
                    onClick={onReset}
                    disabled={calcLoading}
                    className="flex items-center gap-2 px-5 py-2 bg-gray-500 text-white rounded-xl font-bold text-sm hover:bg-gray-600 disabled:opacity-50 transition-all shadow-md"
                  >
                    🔄 שחזור
                  </button>
                  <button
                    onClick={onRecalculate}
                    disabled={calcLoading}
                    className="flex items-center gap-2 px-5 py-2 bg-blue-600 text-white rounded-xl font-bold text-sm hover:bg-blue-700 disabled:opacity-50 transition-all shadow-md"
                  >
                    {calcLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Calculator className="h-4 w-4" />}
                    חשב
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                <BaseDataCard
                  label="מחיר ספק לקרטון"
                  currentValue={`$${chain.supplierPricePerCarton.toFixed(2)}`}
                  subtitle={item?.lastPurchaseDate ? `עדכון: ${new Date(item.lastPurchaseDate).toLocaleDateString('he-IL')}` : undefined}
                  inputValue={overrides.supplierPrice}
                  placeholder={chain.supplierPricePerCarton.toString()}
                  onChange={(v) => onOverrideChange('supplierPrice', v)}
                  prefix="$"
                />
                <BaseDataCard
                  label="עלות הובלה למכולה"
                  currentValue={`$${chain.freightCostPerContainer}`}
                  subtitle={`לקרטון: $${chain.freightCostPerCarton.toFixed(2)}`}
                  inputValue={overrides.freight}
                  placeholder={chain.freightCostPerContainer.toString()}
                  onChange={(v) => onOverrideChange('freight', v)}
                  prefix="$"
                />
                <BaseDataCard
                  label="אחוז רווח"
                  currentValue={`${chain.marginPercentage}%`}
                  subtitle={chain.categoryName ? `קטגוריה: ${chain.categoryName}` : undefined}
                  inputValue={overrides.margin}
                  placeholder={chain.marginPercentage.toString()}
                  onChange={(v) => onOverrideChange('margin', v)}
                  prefix="%"
                />
                <BaseDataCard
                  label="שער הדולר (בנק ישראל)"
                  currentValue={chain.bankRate ? `₪${chain.bankRate.toFixed(4)}` : '—'}
                  inputValue={overrides.bankRate}
                  placeholder={chain.bankRate?.toString() || ''}
                  onChange={(v) => onOverrideChange('bankRate', v)}
                  prefix="₪"
                />
                <BaseDataCard
                  label={`שער כולל מרווח (${chain.rateMarginPercent}%)`}
                  currentValue={`₪${chain.usdToIls.toFixed(4)}`}
                  inputValue={overrides.usdRate}
                  placeholder={chain.usdToIls.toFixed(4)}
                  onChange={(v) => onOverrideChange('usdRate', v)}
                  prefix="₪"
                />
                <BaseDataCard
                  label="CBM לקרטון"
                  currentValue={`${chain.boxCBM}`}
                  inputValue={overrides.boxCBM}
                  placeholder={chain.boxCBM.toString()}
                  onChange={(v) => onOverrideChange('boxCBM', v)}
                  prefix=""
                />
                <BaseDataCard
                  label="יחידות בקרטון"
                  currentValue={`${chain.qtyPerCarton}`}
                  inputValue={overrides.qtyPerCarton}
                  placeholder={chain.qtyPerCarton.toString()}
                  onChange={(v) => onOverrideChange('qtyPerCarton', v)}
                  prefix=""
                />
              </div>
            </div>

            {/* Row 3: Calculation Results (Outputs) */}
            <div>
              <h3 className="text-sm font-bold text-gray-600 mb-3">תוצאות חישוב</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                <ResultCard
                  label="מחיר לקרטון (USD)"
                  value={`$${chain.calculatedPricePerCartonUSD.toFixed(2)}`}
                />
                <ResultCard
                  label="מחיר ליחידה (USD)"
                  value={`$${chain.calculatedPricePerUnitUSD.toFixed(2)}`}
                />
                <ResultCard
                  label="מחיר לקרטון (₪)"
                  value={`₪${chain.calculatedPricePerCartonILS.toFixed(2)}`}
                />
                <ResultCard
                  label="מחיר ליחידה (₪)"
                  value={`₪${chain.calculatedPricePerUnitILS.toFixed(2)}`}
                />
                {chain.lastSaleInfo ? (
                  <ResultCard
                    label="מכירה אחרונה"
                    value={`₪${chain.lastSaleInfo.priceILS.toFixed(2)}`}
                    subtitle={chain.lastSaleInfo.date
                      ? new Date(chain.lastSaleInfo.date).toLocaleDateString('he-IL')
                      : undefined}
                  />
                ) : (
                  <ResultCard label="מכירה אחרונה" value="—" subtitle="אין נתונים" />
                )}
              </div>
            </div>

            {/* Equation Box */}
            <div className="bg-white rounded-2xl shadow-md p-5 border-r-4 border-blue-500">
              <h3 className="text-sm font-bold text-gray-700 mb-3">פירוט החישוב</h3>
              <div className="text-sm text-gray-600 space-y-2 leading-relaxed">
                <div>
                  <span className="text-gray-500">עלות לקרטון = מחיר ספק + הובלה = </span>
                  <span className="font-bold text-gray-900">
                    ${chain.supplierPricePerCarton.toFixed(2)} + ${chain.freightCostPerCarton.toFixed(2)} = ${chain.totalCostPerCarton.toFixed(2)}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500">מחיר מחושב USD = עלות × (1 + רווח) = </span>
                  <span className="font-bold text-gray-900">
                    ${chain.totalCostPerCarton.toFixed(2)} × {(1 + chain.marginPercentage / 100).toFixed(2)} = ${chain.calculatedPricePerCartonUSD.toFixed(2)}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500">מחיר מחושב ₪ = USD × שער = </span>
                  <span className="font-bold text-gray-900">
                    ${chain.calculatedPricePerCartonUSD.toFixed(2)} × ₪{chain.usdToIls.toFixed(4)} = ₪{chain.calculatedPricePerCartonILS.toFixed(2)}
                  </span>
                </div>
                <div className="border-t border-gray-200 pt-2 mt-2">
                  <span className="text-gray-500">הנוסחה: </span>
                  <span className="font-bold text-blue-700">
                    (${chain.supplierPricePerCarton.toFixed(2)} + ${chain.freightCostPerCarton.toFixed(2)}) × {(1 + chain.marginPercentage / 100).toFixed(2)} × ₪{chain.usdToIls.toFixed(4)} = ₪{chain.calculatedPricePerCartonILS.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}



        {/* Multi-SKU Section */}
        <MultiSKUPricingSection
          rows={multiSKUProps.rows}
          fromQuery={multiSKUProps.fromQuery}
          toQuery={multiSKUProps.toQuery}
          fromResults={multiSKUProps.fromResults}
          toResults={multiSKUProps.toResults}
          fromSearching={multiSKUProps.fromSearching}
          toSearching={multiSKUProps.toSearching}
          fromItem={multiSKUProps.fromItem}
          toItem={multiSKUProps.toItem}
          showFromDropdown={multiSKUProps.showFromDropdown}
          showToDropdown={multiSKUProps.showToDropdown}
          onSetFromQuery={multiSKUProps.onSetFromQuery}
          onSetToQuery={multiSKUProps.onSetToQuery}
          onSelectFrom={multiSKUProps.onSelectFrom}
          onSelectTo={multiSKUProps.onSelectTo}
          onSetShowFromDropdown={multiSKUProps.onSetShowFromDropdown}
          onSetShowToDropdown={multiSKUProps.onSetShowToDropdown}
          onAddRange={multiSKUProps.onAddRange}
          addingRange={multiSKUProps.addingRange}
          onOverrideChange={multiSKUProps.onOverrideChange}
          onCalculateRow={multiSKUProps.onCalculateRow}
          onResetRow={multiSKUProps.onResetRow}
          onDeleteRow={multiSKUProps.onDeleteRow}
        />

      </div>

      {/* Footer - Sticky to Bottom */}
      <div className="text-center text-sm text-gray-400 py-6 border-t border-gray-200/50">
        <p>כל הזכויות שמורות - בראבו מערכות {new Date().getFullYear()} &copy;</p>
      </div>
    </div>
  );
}

/* ============================
   Base Data Card (Editable)
   ============================ */
function BaseDataCard({
  label,
  currentValue,
  subtitle,
  inputValue,
  placeholder,
  onChange,
  prefix,
}: {
  label: string;
  currentValue: string;
  subtitle?: string;
  inputValue: string;
  placeholder: string;
  onChange: (value: string) => void;
  prefix: string;
}) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-blue-100 p-3 flex flex-col">
      <div className="text-xs font-medium text-gray-500 mb-1">{label}</div>
      <div className="text-lg font-bold text-gray-900 mb-1">{currentValue}</div>
      {subtitle && <div className="text-[10px] text-gray-400 mb-2">{subtitle}</div>}
      <div className="mt-auto">
        <div className="relative">
          <input
            type="number"
            value={inputValue}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            step="any"
            className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-xs bg-gray-50 focus:bg-white focus:ring-1 focus:ring-blue-400 focus:border-blue-400 transition-colors"
          />
          {prefix && <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] text-gray-400">{prefix}</span>}
        </div>
      </div>
    </div>
  );
}

/* ============================
   Result Card (Output)
   ============================ */
function ResultCard({ label, value, subtitle }: { label: string; value: string; subtitle?: string }) {
  return (
    <div className="bg-orange-50 border border-orange-200 rounded-xl p-3 flex flex-col">
      <div className="text-xs font-medium text-orange-700 mb-1">{label}</div>
      <div className="text-lg font-bold text-orange-900">{value}</div>
      {subtitle && <div className="text-[10px] text-orange-500 mt-1">{subtitle}</div>}
    </div>
  );
}
