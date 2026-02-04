import { X, Plus, Minus, ShoppingCart, Loader2, Package, Ruler, Repeat } from 'lucide-react';
import type { SalesItem } from '@bravo/shared';

interface ItemDetailModalViewProps {
  item: SalesItem;
  cartons: number;
  showCurrency: 'ILS' | 'USD';
  pricePerUnitDisplay: string;
  pricePerCartonDisplay: string;
  totalPriceDisplay: string;
  priceSource?: string;
  cartonsPerContainer?: number;
  totalCBM?: number;
  isLoading: boolean;
  errorMessage?: string;
  onClose: () => void;
  onAddToCart: () => void;
  onSetCartons: (value: number) => void;
  onDecreaseCartons: () => void;
  onIncreaseCartons: () => void;
  onToggleCurrency: () => void;
}

export function ItemDetailModalView({
  item,
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
  onClose,
  onAddToCart,
  onSetCartons,
  onDecreaseCartons,
  onIncreaseCartons,
  onToggleCurrency,
}: ItemDetailModalViewProps) {
  const priceSourceLabel =
    priceSource === 'special_price'
      ? '⭐ מחיר מיוחד ללקוח'
      : priceSource === 'last_sale'
        ? ' מחיר מכירה אחרון'
        : ' מחיר מחושב';

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" dir="rtl">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[95vh] overflow-y-auto">
        {/* Header - לוגו באמצע, X בצד */}
        <div className="sticky top-0 bg-white border-b px-4 py-3 flex items-center justify-between z-10">
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <X className="w-6 h-6" />
          </button>
          <h2 className="text-xl font-bold text-gray-800">פרטי מוצר</h2>
          <img src="/logoBravo.svg" alt="Bravo" className="h-8" />
        </div>

        <div className="p-4 space-y-4">
          {/* שורה עליונה - תמונה + פרטי מוצר */}
          <div className="flex gap-4">
            {/* תמונה בצד שמאל */}
            {item.imageUrl && (
              <div className="flex-shrink-0">
                <img
                  src={item.imageUrl}
                  alt={item.nameHe || item.englishDescription || item.itemCode}
                  className="w-55 h-32 rounded-lg shadow-md object-contain bg-gray-50"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              </div>
            )}

            {/* פרטי מוצר */}
            <div className="flex-1">
              <h3 className="text-2xl font-bold text-gray-900">
                {item.nameHe || item.englishDescription}
              </h3>
             
              <p className="text-sm text-gray-400 mt-1">קוד מוצר: {item.itemCode}</p>

              {/* מקור מחיר */}
              {priceSource && !isLoading && (
                <span
                  className={`inline-block mt-2 px-3 py-1 rounded-full text-xs font-semibold ${
                    priceSource === 'special_price'
                      ? 'bg-blue-100 text-blue-700'
                      : priceSource === 'last_sale'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-blue-100 text-blue-700'
                  }`}
                >
                  {priceSourceLabel}
                </span>
              )}
            </div>
          </div>

          {/* Error message if exists */}
          {errorMessage && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center text-red-600">
              {errorMessage}
            </div>
          )}

          {/* שני ריבועים - מחיר ליחידה ומחיר לקרטון */}
          <div className="grid grid-cols-2 gap-4">
            <div className=" border border-blue-200 rounded-xl p-4 text-center">
              <p className="text-sm text-gray-600 mb-1">מחיר ליחידה</p>
              {isLoading ? (
                <div className="flex justify-center">
                  <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
                </div>
              ) : (
                <p className="text-2xl font-bold text-blue-600">{pricePerUnitDisplay}</p>
              )}
            </div>
            <div className=" border border-blue-200 rounded-xl p-4 text-center">
              <p className="text-sm text-gray-600 mb-1">מחיר לקרטון ({item.qtyPerCarton} יח')</p>
              {isLoading ? (
                <div className="flex justify-center">
                  <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
                </div>
              ) : (
                <p className="text-2xl font-bold text-blue-600">{pricePerCartonDisplay}</p>
              )}
            </div>
          </div>

          {/* כפתור המרה לדולרים */}
          <div className="flex justify-center">
            <button
              onClick={onToggleCurrency}
              className="flex items-center gap-2 px-4 py-2 bg-white border-2 border-blue-300 text-blue-700 rounded-lg hover:bg-blue-50 transition-colors font-medium"
            >
              <Repeat className="w-4 h-4" />
              {showCurrency === 'ILS' ? 'הצג בדולרים ($)' : 'הצג בשקלים (₪)'}
            </button>
          </div>

          {/* אזור בחירת כמות */}
          <div className="bg-blue-50  rounded-xl p-4">
            <h4 className="font-semibold text-gray-800 mb-3 text-center">בחר כמות קרטונים</h4>

            {/* בורר כמות */}
            <div className="flex items-center justify-center gap-3 mb-3">
              <button
                onClick={onDecreaseCartons}
                className="w-10 h-10 flex items-center justify-center bg-white border-2 border-gray-300 rounded-lg hover:bg-gray-50"
              >
                <Minus className="w-5 h-5" />
              </button>
              <input
                type="number"
                value={cartons}
                onChange={(e) => onSetCartons(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-20 h-10 px-2 border-2 border-gray-300 rounded-lg text-center text-xl font-bold"
                min="1"
              />
              <button
                onClick={onIncreaseCartons}
                className="w-10 h-10 flex items-center justify-center bg-white border-2 border-gray-300 rounded-lg hover:bg-gray-50"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>

            {/* סה"כ מארזים */}
            <p className="text-center text-gray-700 mb-2">
              <span className="font-medium">סה"כ מארזים: </span>
              <span className="font-bold text-blue-600">{cartons * (item.qtyPerCarton || 1)}</span>
              <span className="text-sm text-gray-500">
                {' '}
                ({cartons} קרטונים × {item.qtyPerCarton || 1} יח')
              </span>
            </p>

            {/* מחיר סה"כ */}
            {isLoading ? (
              <div className="flex justify-center">
                <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
              </div>
            ) : (
              <p className="text-center text-2xl font-bold text-blue-600">{totalPriceDisplay}</p>
            )}
          </div>

              {/* שני ריבועים - מידות אריזה ומידות משלוח */}
              <div className="grid grid-cols-2 gap-4">
                {/* מידות אריזה */}
                <div className="bg-white border border-gray-200 rounded-xl p-3">
                  <h4 className="font-semibold text-gray-800 mb-2 flex items-center gap-2 text-sm">
                    <Package className="w-4 h-4 text-red-600" />
                    מידות אריזה
                  </h4>
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span className="text-gray-600">יחידות בקרטון:</span>
                      <span className="font-semibold">{item.qtyPerCarton || 'N/A'}</span>
                    </div>
                    {item.cartonHeight && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">גובה:</span>
                        <span className="font-semibold">{item.cartonHeight} ס"מ</span>
                      </div>
                    )}
                    {item.cartonLength && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">אורך:</span>
                        <span className="font-semibold">{item.cartonLength} ס"מ</span>
                      </div>
                    )}
                    {item.cartonWidth && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">רוחב:</span>
                        <span className="font-semibold">{item.cartonWidth} ס"מ</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* מידות משלוח */}
                <div className="bg-white border border-gray-200 rounded-xl p-3">
                  <h4 className="font-semibold text-gray-800 mb-2 flex items-center gap-2 text-sm">
                    <Ruler className="w-4 h-4 text-red-600" />
                    מידות משלוח
                  </h4>
                  <div className="space-y-1 text-xs">
                    {item.boxCBM && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">CBM לקרטון:</span>
                        <span className="font-semibold">{item.boxCBM.toFixed(4)}</span>
                      </div>
                    )}
                    {(cartonsPerContainer || item.boxCBM) && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">קרטונים למכולה:</span>
                        <span className="font-semibold">
                          {cartonsPerContainer || Math.floor(67 / item.boxCBM!)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* שורת סיכום */}
              <div className="bg-gray-50 rounded-xl p-3 flex items-center justify-between text-sm">
                <div className="flex gap-4">
                  <span>
                    <span className="text-gray-600">סה"כ CBM: </span>
                    <span className="font-bold">{totalCBM?.toFixed(3) || '-'}</span>
                  </span>
                  <span>
                    <span className="text-gray-600">קרטונים: </span>
                    <span className="font-bold">{cartons}</span>
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-lg text-blue-600">{totalPriceDisplay}</span>
                  <button
                    onClick={onToggleCurrency}
                    className="text-xs text-blue-600 hover:underline"
                  >
                    {showCurrency === 'ILS' ? '($)' : '(₪)'}
                  </button>
                </div>
              </div>
        </div>

        {/* כפתורים תחתונים */}
        <div className="sticky bottom-0 bg-white p-4 border-t flex gap-3">
          <button
            onClick={onAddToCart}
            disabled={isLoading || !!errorMessage}
            className="flex-1 flex items-center justify-center gap-2 py-3 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ShoppingCart className="w-5 h-5" />
            הוסף לסל
          </button>
          <button
            onClick={onClose}
            className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium"
          >
            סגור
          </button>
        </div>
      </div>
    </div>
  );
}
