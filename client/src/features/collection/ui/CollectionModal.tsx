import { useState, useEffect } from 'react';
import { X, Check, Loader2 } from 'lucide-react';
import type { CollectionCase } from '../api';

interface CollectionModalProps {
  isOpen: boolean;
  caseItem: CollectionCase | null;
  customerName: string;
  onConfirm: (amount: number, note?: string) => void;
  onCancel: () => void;
  isLoading: boolean;
}

export function CollectionModal({
  isOpen,
  caseItem,
  customerName,
  onConfirm,
  onCancel,
  isLoading,
}: CollectionModalProps) {
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [error, setError] = useState('');

  // Reset amount when modal opens with new case
  useEffect(() => {
    if (isOpen && caseItem) {
      setAmount(caseItem.caseTotalWithVAT?.toString() || '');
      setNote('');
      setError('');
    }
  }, [isOpen, caseItem]);

  if (!isOpen || !caseItem) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);
    if (!amount || isNaN(numAmount) || numAmount <= 0) {
      setError('יש להזין סכום תקין');
      return;
    }

    // If partial payment, note is required
    const isPartialPayment = numAmount < caseItem!.caseTotalWithVAT;
    if (isPartialPayment && !note.trim()) {
      setError('הערה חובה לגבייה חלקית');
      return;
    }

    onConfirm(numAmount, note || undefined);
  };

  const formatCurrency = (val: number) => {
    if (isNaN(val)) return '₪0';
    return `₪${val.toLocaleString('he-IL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" dir="rtl">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-500 to-teal-600 p-4 text-white">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold">סימון גבייה</h3>
            <button
              onClick={onCancel}
              className="p-1 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6">
          {/* Case Info */}
          <div className="bg-gray-50 rounded-xl p-4 mb-4">
            <p className="text-sm text-gray-500 mb-1">לקוח</p>
            <p className="font-bold text-gray-900 mb-3">{customerName}</p>
            <p className="text-sm text-gray-500 mb-1">תיק מספר</p>
            <p className="font-bold text-gray-900 mb-3">#{caseItem.caseNumber}</p>
            <p className="text-sm text-gray-500 mb-1">סכום לגבייה</p>
            <p className="font-bold text-xl text-amber-600">
              {formatCurrency(caseItem.caseTotalWithVAT)}
            </p>
          </div>

          {/* Amount Input */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              סכום שנגבה בפועל (₪) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              step="0.01"
              value={amount}
              onChange={(e) => {
                setAmount(e.target.value);
                setError('');
              }}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-emerald-500 focus:outline-none text-lg font-bold text-center"
              placeholder="הזיני סכום"
              autoFocus
            />
            {error && <p className="mt-2 text-red-500 text-sm">{error}</p>}
          </div>

          {/* Note for Partial Payment or Optional Note */}
          {(() => {
            const isPartialPayment = parseFloat(amount) < caseItem.caseTotalWithVAT;
            return (
              <div className={`mb-4 p-3 rounded-xl border ${isPartialPayment ? 'bg-amber-50 border-amber-200' : 'bg-blue-50 border-blue-200'}`}>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  הערה {isPartialPayment && <span className="text-red-500">*</span>}
                </label>
                <textarea
                  value={note}
                  onChange={(e) => {
                    setNote(e.target.value);
                    setError('');
                  }}
                  placeholder={isPartialPayment ? "אנא הסבר מדוע הגבייה חלקית..." : "הערה אופציונלית..."}
                  className={`w-full px-3 py-2 border-2 rounded-lg focus:outline-none text-sm resize-none ${
                    isPartialPayment
                      ? 'border-amber-200 focus:border-amber-500'
                      : 'border-blue-200 focus:border-blue-500'
                  }`}
                  rows={3}
                />
              </div>
            );
          })()}

          {/* Quick Amount Buttons */}
          <div className="flex gap-2 mb-6">
            <button
              type="button"
              onClick={() => setAmount(caseItem.caseTotalWithVAT?.toString() || '')}
              className="flex-1 py-2 px-3 bg-emerald-50 text-emerald-700 rounded-lg text-sm font-medium hover:bg-emerald-100 transition-colors"
            >
              סכום מלא
            </button>
            <button
              type="button"
              onClick={() => setAmount((caseItem.caseTotalWithVAT / 2)?.toFixed(2) || '')}
              className="flex-1 py-2 px-3 bg-amber-50 text-amber-700 rounded-lg text-sm font-medium hover:bg-amber-100 transition-colors"
            >
              50%
            </button>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 py-3 px-4 border-2 border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors"
            >
              ביטול
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 py-3 px-4 bg-emerald-500 text-white rounded-xl font-bold hover:bg-emerald-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  שומר...
                </>
              ) : (
                <>
                  <Check className="h-5 w-5" />
                  אישור גבייה
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
