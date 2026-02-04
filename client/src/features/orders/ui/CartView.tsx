import { ShoppingCart, Trash2, Plus, Minus, Package, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import type { CartItem } from '../api';

interface CartViewProps {
  items: CartItem[];
  notes: string;
  onNotesChange: (value: string) => void;
  onUpdateQuantity: (itemId: string, cartons: number) => void;
  onRemoveItem: (itemId: string) => void;
  onClearCart: () => void;
  onSubmitOrder: (status: 'draft' | 'quote' | 'order') => void;
  totalItems: number;
  totalUnits: number;
  totalCBM: number;
  totalAmountILS: number;
  totalAmountUSD: number;
  containerCount: number;
  formatPrice: (amount: number, currency: 'ILS' | 'USD') => string;
  showSuccess: boolean;
  isSubmitting: boolean;
  errorMessage?: string;
}

export function CartView({
  items,
  notes,
  onNotesChange,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  onSubmitOrder,
  totalItems,
  totalUnits,
  totalCBM,
  totalAmountILS,
  totalAmountUSD,
  containerCount,
  formatPrice,
  showSuccess,
  isSubmitting,
  errorMessage,
}: CartViewProps) {
  if (items.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-md p-8 text-center">
        <ShoppingCart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-bold text-gray-900 mb-2">הסל ריק</h3>
        <p className="text-gray-500">הוסף פריטים לסל כדי ליצור הזמנה</p>
      </div>
    );
  }

  if (showSuccess) {
    return (
      <div className="bg-green-50 rounded-xl shadow-md p-8 text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-8 h-8 text-green-600" />
        </div>
        <h3 className="text-lg font-bold text-green-800 mb-2">ההזמנה נשלחה בהצלחה!</h3>
        <p className="text-green-600">מעבר לסל הבחירה...</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden">
      <div className="p-4 border-b flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShoppingCart className="w-5 h-5 text-red-600" />
          <h2 className="font-bold text-gray-900">סל הקניות</h2>
          <span className="bg-red-100 text-red-600 text-sm px-2 py-0.5 rounded-full">
            {items.length} פריטים
          </span>
        </div>
        <button
          onClick={onClearCart}
          className="text-sm text-gray-500 hover:text-red-600 transition-colors"
        >
          נקה סל
        </button>
      </div>

      <div className="divide-y max-h-80 overflow-y-auto">
        {items.map((item) => (
          <div key={item.itemId} className="p-4 flex gap-3">
            <div className="w-20 h-16  rounded-lg flex-shrink-0 flex items-center justify-center overflow-hidden">
              {item.imageUrl ? (
                <img
                  src={item.imageUrl}
                  alt={item.nameHe || item.itemCode}
                  className="w-full h-full object-contain"
                />
              ) : (
                <Package className="w-8 h-8 text-gray-400" />
              )}
            </div>

            <div className="flex-1 min-w-0">
              <h4 className="font-medium text-gray-900 truncate">
                {item.nameHe || item.englishDescription}
              </h4>
              <p className="text-sm text-gray-500">{item.itemCode}</p>
              <p className="text-sm font-medium text-red-600">
                {formatPrice(item.totalPrice, item.currency)}
              </p>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => onUpdateQuantity(item.itemId, Math.max(1, item.cartons - 1))}
                className="w-8 h-8 flex items-center justify-center bg-gray-100 hover:bg-gray-200 rounded-full transition-colors"
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="w-8 text-center font-medium">{item.cartons}</span>
              <button
                onClick={() => onUpdateQuantity(item.itemId, item.cartons + 1)}
                className="w-8 h-8 flex items-center justify-center bg-gray-100 hover:bg-gray-200 rounded-full transition-colors"
              >
                <Plus className="w-4 h-4" />
              </button>
              <button
                onClick={() => onRemoveItem(item.itemId)}
                className="w-8 h-8 flex items-center justify-center text-red-500 hover:bg-red-50 rounded-full transition-colors mr-2"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="p-4 bg-gray-50 space-y-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500">סה"כ ארגזים:</span>
            <span className="font-medium">{totalItems}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">סה"כ יחידות:</span>
            <span className="font-medium">{totalUnits.toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">סה"כ נפח:</span>
            <span className="font-medium">{totalCBM.toFixed(2)} CBM</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">מכולות (67 CBM):</span>
            <span className="font-medium">{containerCount.toFixed(2)}</span>
          </div>
        </div>

        <div className="flex justify-between items-center pt-4 border-t">
          <span className="font-bold text-gray-900">סה"כ:</span>
          <div className="text-left">
            {totalAmountILS > 0 && (
              <div className="text-xl font-bold text-red-600">{formatPrice(totalAmountILS, 'ILS')}</div>
            )}
            {totalAmountUSD > 0 && (
              <div className="text-xl font-bold text-red-600">{formatPrice(totalAmountUSD, 'USD')}</div>
            )}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">הערות</label>
          <textarea
            value={notes}
            onChange={(event) => onNotesChange(event.target.value)}
            placeholder="הוסף הערות להזמנה..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-red-500 focus:ring-2 focus:ring-red-200 outline-none resize-none"
            rows={2}
          />
        </div>

        {errorMessage && (
          <div className="flex items-center gap-2 text-red-600 text-sm">
            <AlertCircle className="w-4 h-4" />
            <span>{errorMessage}</span>
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={() => onSubmitOrder('quote')}
            disabled={isSubmitting}
            className="flex-1 py-3 border-2 border-red-600 text-red-600 font-medium rounded-lg hover:bg-red-50 disabled:opacity-50 transition-colors"
          >
            {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'שמור כהצעת מחיר'}
          </button>
          <button
            onClick={() => onSubmitOrder('order')}
            disabled={isSubmitting}
            className="flex-1 py-3 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
          >
            {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'שלח הזמנה'}
          </button>
        </div>
      </div>
    </div>
  );
}
