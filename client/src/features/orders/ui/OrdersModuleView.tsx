import { ArrowRight, ChevronDown, ChevronUp, Loader2 } from 'lucide-react';
import type { OrderItem } from '../api';

interface OrdersModuleViewProps {
  selectedTab: 'sent' | 'draft';
  onTabChange: (tab: 'sent' | 'draft') => void;
  sentOrders: OrderItem[];
  draftOrders: OrderItem[];
  isLoading: boolean;
  expandedOrderId: string | null;
  onToggleExpand: (orderId: string) => void;
  onStatusChange: (orderId: string, newStatus: string) => void;
  isUpdating: boolean;
  onBack: () => void;
}

export function OrdersModuleView({
  selectedTab,
  onTabChange,
  sentOrders,
  draftOrders,
  isLoading,
  expandedOrderId,
  onToggleExpand,
  onStatusChange,
  isUpdating,
  onBack,
}: OrdersModuleViewProps) {
  const statusOptions = ['pending', 'approved', 'deposit_received', 'closed', 'cancelled'];
  const statusLabels: Record<string, string> = {
    pending: 'בהמתנה',
    approved: 'אושר',
    deposit_received: 'התקבלה מקדמה',
    closed: 'סגור',
    cancelled: 'בוטל',
    order: 'הזמנה שנשלחה',
    draft: 'טיוטה',
    quote: 'הצעה',
  };

  const statusColors: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    approved: 'bg-green-100 text-green-800 border-green-300',
    deposit_received: 'bg-blue-100 text-blue-800 border-blue-300',
    closed: 'bg-gray-100 text-gray-800 border-gray-300',
    cancelled: 'bg-red-100 text-red-800 border-red-300',
    order: 'bg-purple-100 text-purple-800 border-purple-300',
    draft: 'bg-orange-100 text-orange-800 border-orange-300',
  };

  const formatCreatedBy = (order: OrderItem) => {
    if (order.createdByName) return order.createdByName;
    if (!order.createdBy) return 'לא ידוע';
    const looksLikeId = /^[a-f0-9]{24}$/i.test(order.createdBy);
    return looksLikeId ? 'לא ידוע' : order.createdBy;
  };

  const currentOrders = selectedTab === 'sent' ? sentOrders : draftOrders;

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-100 via-blue-50 to-gray-100 p-6" dir="rtl">
      {/* Back button */}
      <button
        onClick={onBack}
        className="absolute top-6 right-6 flex items-center gap-2 px-4 py-2 bg-white hover:bg-gray-50 rounded-xl text-gray-700 transition-all shadow-lg"
      >
        <ArrowRight className="w-5 h-5" />
        <span className="font-medium">חזרה</span>
      </button>

      <div className="max-w-4xl mx-auto pt-8">
        {/* Logo */}
        <div className="text-center mb-8">
          <img src="/logoBravo.svg" alt="Bravo Logo" className="h-20 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-gray-800">היסטוריית הזמנות</h1>
          <p className="text-gray-500 mt-2">צפייה בהזמנות שנשלחו ובטיוטות</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-6 space-y-6">
        {/* Tabs */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => onTabChange('sent')}
            className={`py-3 px-4 rounded-xl font-bold border-2 transition-all ${
              selectedTab === 'sent'
                ? 'bg-red-50 border-red-500 text-red-700'
                : 'bg-white border-gray-200 text-gray-600 hover:border-red-300 hover:text-red-600'
            }`}
          >
            הזמנות שנשלחו ({sentOrders.length})
          </button>
          <button
            onClick={() => onTabChange('draft')}
            className={`py-3 px-4 rounded-xl font-bold border-2 transition-all ${
              selectedTab === 'draft'
                ? 'bg-red-50 border-red-500 text-red-700'
                : 'bg-white border-gray-200 text-gray-600 hover:border-red-300 hover:text-red-600'
            }`}
          >
            טיוטות ({draftOrders.length})
          </button>
        </div>

        {/* Loading */}
        {isLoading && (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-red-500" />
          </div>
        )}

        {/* Empty state */}
        {!isLoading && currentOrders.length === 0 && (
          <div className="text-center py-12 text-gray-500 border-2 border-gray-200 rounded-xl">
            <p className="text-lg font-medium">אין הזמנות</p>
            <p className="text-sm mt-1">
              {selectedTab === 'sent' ? 'אין הזמנות שנשלחו עדיין' : 'אין טיוטות'}
            </p>
          </div>
        )}

        {/* Orders list */}
        {!isLoading && currentOrders.length > 0 && (
          <div className="space-y-3">
            {currentOrders.map((order) => {
              const isExpanded = expandedOrderId === order._id;
              return (
                <div
                  key={order._id}
                  className="border-2 border-gray-200 rounded-xl overflow-hidden bg-white hover:border-blue-200 transition-colors"
                >
                  {/* Order header */}
                  <div className="p-4 border-b border-gray-200">
                    <div className="flex flex-col gap-3">
                      <div className="flex items-start justify-between gap-3">
                        
                        <div className="min-w-0 text-right">
                          <div className="text-xs text-gray-500">לקוח</div>
                          <div className="font-bold text-gray-900 truncate">{order.customerName}</div>
                        </div>
                        <div className="min-w-0 text">
                          <div className="text-xs text-gray-500">מספר הזמנה</div>
                          <div className="font-bold text-gray-900">{order.orderNumber}</div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm items-center">
                        <div>
                          <div className="text-xs text-gray-500">תאריך</div>
                          <div className="font-bold text-gray-900">
                            {new Date(order.createdAt).toLocaleDateString('he-IL')}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500">נוצר ע״י</div>
                          <div className="font-bold text-gray-900 truncate">{formatCreatedBy(order)}</div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500">סכום</div>
                          <div className="font-bold text-gray-900">
                            {order.totalAmountILS > 0
                              ? `₪${order.totalAmountILS.toLocaleString('he-IL')}`
                              : `$${order.totalAmountUSD.toLocaleString('he-IL')}`}
                          </div>
                        </div>
                        <div className="flex items-center justify-end gap-2">
                          {selectedTab === 'sent' ? (
                            <select
                              value={order.status}
                              onChange={(e) => onStatusChange(order._id, e.target.value)}
                              disabled={isUpdating}
                              className={`w-32 h-9 px-2 py-1.5 rounded-lg text-xs font-bold border-2 ${
                                statusColors[order.status] || 'bg-gray-100 text-gray-800'
                              } cursor-pointer disabled:opacity-50`}
                            >
                              {statusOptions.map((status) => (
                                <option key={status} value={status}>
                                  {statusLabels[status]}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <div
                              className={`w-32 h-9 px-3 py-1.5 rounded-lg text-xs font-bold border-2 text-center flex items-center justify-center ${
                                statusColors[order.status] || 'bg-gray-100 text-gray-800'
                              }`}
                            >
                              {statusLabels[order.status]}
                            </div>
                          )}
                          <button
                            onClick={() => onToggleExpand(order._id)}
                            className="w-9 h-9 flex items-center justify-center   transition-colors"
                            aria-label={isExpanded ? 'סגור פרטים' : 'פתח פרטים'}
                          >
                            {isExpanded ? (
                              <ChevronUp className="w-4 h-4 text-gray-600" />
                            ) : (
                              <ChevronDown className="w-4 h-4 text-gray-600" />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Order details (expanded) */}
                  {isExpanded && (
                    <div className="px-4 pb-4 pt-2 border-t border-gray-100 bg-gray-50">
                      <h4 className="font-bold text-gray-800 mb-3">פריטים בהזמנה:</h4>
                      <div className="space-y-2 mb-4">
                        {order.lines.map((line, idx) => (
                          <div key={idx} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-sm bg-white p-3 rounded-lg border border-gray-100">
                            <div>
                              <span className="font-bold text-gray-900">{line.itemCode}</span>
                              <span className="text-gray-600 mr-2">- {line.description}</span>
                            </div>
                            <div className="text-right">
                              <div className="text-gray-900">
                                {line.cartons} קרטון × {line.quantity} יח׳
                              </div>
                              <div className="text-gray-600">
                                {line.currency === 'ILS' ? '₪' : '$'}
                                {line.totalPrice.toFixed(2)}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Summary */}
                      <div className="border-t border-gray-200 pt-3">
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-gray-600">סה״כ CBM:</span>
                          <span className="font-bold text-gray-900">{order.totalCBM.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-gray-600">סה״כ (₪):</span>
                          <span className="font-bold text-gray-900">
                            ₪{order.totalAmountILS.toLocaleString('he-IL')}
                          </span>
                        </div>
                        {order.totalAmountUSD > 0 && (
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">סה״כ ($):</span>
                            <span className="font-bold text-gray-900">
                              ${order.totalAmountUSD.toLocaleString('he-IL')}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Notes */}
                      {order.notes && (
                        <div className="mt-3 p-3 bg-blue-50 rounded-lg text-sm">
                          <span className="text-gray-600">הערות: </span>
                          <span className="text-gray-900">{order.notes}</span>
                        </div>
                      )}

                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
        </div>
      </div>

      {/* Footer */}
      <div className="text-center text-sm text-gray-400 mt-12 pb-6">
        <p>כל הזכויות שמורות - בראבו מערכות {new Date().getFullYear()} &copy;</p>
      </div>
    </div>
  );
}






