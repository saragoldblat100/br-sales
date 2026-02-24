import type { RefObject } from 'react';
import { useState } from 'react';
import {
  ArrowRight,
  LogOut,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Package,
  FileText,
  Calendar,
  Loader2,
  AlertCircle,
  CheckSquare,
  Upload,
  FileSpreadsheet,
  X,
  History,
} from 'lucide-react';
import type { CollectionCase, CollectionCustomer, CollectionDataResponse, CollectionStatsResponse, CollectionUploadMode } from '../api';
import { CollectionModal } from './CollectionModal';

export interface CollectionModuleViewProps {
  // Data
  loading: boolean;
  error: string | null;
  data: CollectionDataResponse | null;
  customers: CollectionCustomer[];
  selectedCustomer: string | null;
  expandedCases: Record<string, boolean>;
  userRole?: string;

  // Upload state
  canUpload: boolean;
  uploadMode: CollectionUploadMode | null;
  file: File | null;
  uploading: boolean;
  uploadResult: { success: boolean; message: string } | null;
  dragActive: boolean;
  fileInputRef: RefObject<HTMLInputElement>;

  // Filter state
  showRecentCollected: boolean;
  dateFrom: string;
  recentCollectedData: CollectionStatsResponse | null;
  loadingStats: boolean;

  // Modal state
  collectionModal: {
    isOpen: boolean;
    caseItem: CollectionCase | null;
    customerName: string;
  };
  markingCase: string | null;

  // Handlers
  onBack: () => void;
  onLogout: () => void;
  onSelectCustomer: (customerName: string | null) => void;
  onToggleCase: (caseNumber: string) => void;
  onOpenCollectionModal: (caseItem: CollectionCase, customerName: string) => void;
  onCloseCollectionModal: () => void;
  onConfirmCollection: (amount: number, note?: string) => void;

  // Upload handlers
  onDrag: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
  onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onUpload: () => void;
  onSelectUploadMode: (mode: CollectionUploadMode | null) => void;
  onClearFile: () => void;

  // Filter handlers
  onToggleRecentCollected: () => void;
  onDateFromChange: (date: string) => void;

  // Unmark collection state & handlers
  unmarkModal: {
    isOpen: boolean;
    caseNumber: string;
    customerName: string;
  };
  unmarking: boolean;
  onUnmarkCollection: (caseNumber: string, customerName: string) => void;
  onCancelUnmark: () => void;
  onConfirmUnmark: () => void;

  // Delete collection state & handlers
  deleteModal: {
    isOpen: boolean;
    caseNumber: string;
    customerName: string;
  };
  deleting: boolean;
  onDeleteCollection: (caseNumber: string, customerName: string) => void;
  onCancelDelete: () => void;
  onConfirmDelete: () => void;
}

// Helper functions
const formatCurrency = (amount: number, currency = 'ILS') => {
  if (!amount) return '₪0';
  const symbol = currency === 'USD' ? '$' : '₪';
  return `${symbol}${amount.toLocaleString('he-IL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const formatDate = (dateStr: string | null) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return '';
  return date.toLocaleDateString('he-IL');
};

const getUrgencyText = (urgency: { daysLeft: number | null }) => {
  if (!urgency || urgency.daysLeft === null) return 'לא ידוע';
  if (urgency.daysLeft < 0) return `באיחור ${Math.abs(urgency.daysLeft)} ימים`;
  if (urgency.daysLeft === 0) return 'היום!';
  return `עוד ${urgency.daysLeft} ימים`;
};

// Upload Section Component
function UploadSection({
  title,
  description,
  onCancel,
  file,
  uploading,
  uploadResult,
  dragActive,
  fileInputRef,
  onDrag,
  onDrop,
  onFileSelect,
  onUpload,
  onClearFile,
}: Pick<
  CollectionModuleViewProps,
  'file' | 'uploading' | 'uploadResult' | 'dragActive' | 'fileInputRef' | 'onDrag' | 'onDrop' | 'onFileSelect' | 'onUpload' | 'onClearFile'
> & { title: string; description: string; onCancel: () => void }) {
  return (
    <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
      <div className="flex items-center gap-3 mb-4">
        <Upload className="h-6 w-6 text-gray-600" />
        <div className="flex-grow">
          <h3 className="font-bold text-gray-900">{title}</h3>
          <p className="text-sm text-gray-500">{description}</p>
        </div>
        <button
          onClick={onCancel}
          className="p-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-gray-700 transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {uploadResult && (
        <div className="mb-4 p-4 bg-emerald-50 rounded-xl border border-emerald-200">
          <div className="flex items-center gap-3">
            <CheckCircle className="h-6 w-6 text-emerald-600 flex-shrink-0" />
            <p className="font-bold text-emerald-800">{uploadResult.message}</p>
          </div>
        </div>
      )}

      <div
        onDragEnter={onDrag}
        onDragLeave={onDrag}
        onDragOver={onDrag}
        onDrop={onDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`
          border-2 border-dashed rounded-xl p-6 transition-all cursor-pointer
          ${dragActive
            ? 'border-blue-400 bg-blue-50'
            : file
              ? 'border-blue-300 bg-blue-50/50'
              : 'border-gray-200 bg-gray-50/50 hover:border-blue-300 hover:bg-blue-50/30'
          }
        `}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.xls"
          onChange={onFileSelect}
          className="hidden"
        />

        {file ? (
          <div className="text-center">
            <FileSpreadsheet className="h-10 w-10 text-blue-600 mx-auto mb-2" />
            <p className="font-bold text-gray-900 mb-1">{file.name}</p>
            <p className="text-sm text-gray-500 mb-3">{(file.size / 1024).toFixed(1)} KB</p>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onClearFile();
              }}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <X className="h-4 w-4" />
              הסר קובץ
            </button>
          </div>
        ) : (
          <div className="text-center">
            <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
            <p className="font-medium text-gray-700 mb-1">גררי קובץ לכאן או לחצי לבחירה</p>
            <p className="text-xs text-gray-400">קבצי Excel בלבד</p>
          </div>
        )}
      </div>

      {file && (
        <button
          onClick={onUpload}
          disabled={uploading}
          className="w-full mt-4 py-3 bg-blue-600 text-white rounded-xl font-bold shadow-lg hover:bg-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {uploading ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              מעלה קובץ...
            </>
          ) : (
            <>
              <Upload className="h-5 w-5" />
              העלה קובץ
            </>
          )}
        </button>
      )}
    </div>
  );
}

// Customer List Component
function CustomerList({
  customers,
  onSelectCustomer,
}: {
  customers: CollectionCustomer[];
  onSelectCustomer: (name: string) => void;
}) {
  if (customers.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
        <CheckSquare className="h-16 w-16 text-emerald-500 mx-auto mb-4" />
        <h3 className="font-bold text-xl text-gray-900 mb-2">כל התיקים נגבו!</h3>
        <p className="text-gray-500 mb-4">אין תיקים פתוחים לגבייה</p>
      </div>
    );
  }

  return (
    <div className="space-y-3 pb-12">
      <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200">
        {customers.map((customer, index) => (
          <button
            key={customer.customerName}
            onClick={() => onSelectCustomer(customer.customerName)}
            className={`w-full text-right p-3 hover:bg-gray-50 transition-colors ${
              index !== customers.length - 1 ? 'border-b border-gray-100' : ''
            }`}
          >
            <div className="grid grid-cols-[1fr_auto_auto] items-center gap-3">
              {/* Left: Urgency + Name + Cases */}
              <div className="flex items-start gap-2 min-w-0">
                <div className={`mt-1 w-2.5 h-2.5 rounded-full flex-shrink-0 ${
                  customer.urgency?.color === 'red' ? 'bg-red-500' :
                  customer.urgency?.color === 'orange' ? 'bg-amber-500' :
                  customer.urgency?.color === 'green' ? 'bg-emerald-500' : 'bg-gray-300'
                }`} />
                <div className="min-w-0">
                  <div className="text-base font-semibold text-gray-900 truncate">
                    {customer.customerName}
                  </div>
                  <div className="text-sm text-gray-500">
                    {customer.totalCases} תיקים
                  </div>
                </div>
              </div>

              {/* Middle: Urgency Text */}
              <div className="text-xs text-gray-400 whitespace-nowrap">
                {getUrgencyText(customer.urgency)}
              </div>

              {/* Right: Amount + Chevron */}
              <div className="flex items-center gap-1.5">
                <div className="text-base font-bold text-gray-900 whitespace-nowrap">
                  {formatCurrency(customer.totalWithVAT)}
                </div>
                <ChevronDown className="h-4 w-4 text-gray-400 flex-shrink-0" style={{ transform: 'rotate(90deg)' }} />
              </div>
            </div>
          </button>
        ))}
      </div>

      <div className="flex items-center justify-center gap-6 text-xs text-gray-400 pt-2 pb-12">
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-red-500" />
          <span>דחוף</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-amber-500" />
          <span>אזהרה</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-emerald-500" />
          <span>תקין</span>
        </div>
      </div>
    </div>
  );
}

// Recent Collected Component
function RecentCollectedList({
  data,
  loading,
  dateFrom,
  userRole,
  onUnmarkCollection,
  onDeleteCollection,
}: {
  data: CollectionStatsResponse | null;
  loading: boolean;
  dateFrom: string;
  userRole?: string;
  onUnmarkCollection: (caseNumber: string, customerName: string) => void;
  onDeleteCollection: (caseNumber: string, customerName: string) => void;
}) {
  const [expandedCustomers, setExpandedCustomers] = useState<Record<string, boolean>>({});

  if (loading) {
    return (
      <div className="min-h-[200px] flex items-center justify-center">
        <Loader2 className="h-8 w-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  if (!data || data.records.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
        <History className="h-16 w-16 text-gray-300 mx-auto mb-4" />
        <h3 className="font-bold text-xl text-gray-900 mb-2">אין גבייה</h3>
        <p className="text-gray-500">לא נמצאו גביות בתקופה זו</p>
      </div>
    );
  }

  // Filter by date
  const filteredRecords = dateFrom
    ? data.records.filter((r) => new Date(r.collectedAt) >= new Date(dateFrom))
    : data.records;

  // Sort by date (newest first)
  const sortedRecords = [...filteredRecords].sort(
    (a, b) => new Date(b.collectedAt).getTime() - new Date(a.collectedAt).getTime()
  );

  if (sortedRecords.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
        <History className="h-16 w-16 text-gray-300 mx-auto mb-4" />
        <h3 className="font-bold text-xl text-gray-900 mb-2">אין גבייה</h3>
        <p className="text-gray-500">לא נמצאו גביות בתקופה זו</p>
      </div>
    );
  }

  // Group by customer name
  const groupedByCustomer = sortedRecords.reduce(
    (acc, record) => {
      if (!acc[record.customerName]) {
        acc[record.customerName] = [];
      }
      acc[record.customerName].push(record);
      return acc;
    },
    {} as Record<string, typeof sortedRecords>
  );

  const totalCollected = sortedRecords.reduce((sum, r) => sum + r.collectedAmount, 0);
  const customerNames = Object.keys(groupedByCustomer).sort();

  return (
    <div className="space-y-2">
      {/* Summary Card */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm px-3 py-2">
        <div className="grid grid-cols-3 gap-1 text-center">
          <div>
            <p className="text-xs text-gray-600">סה״כ גבייה</p>
            <p className="font-bold text-sm text-blue-600 leading-tight">{formatCurrency(totalCollected)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-600">לקוחות</p>
            <p className="font-bold text-sm text-gray-900 leading-tight">{customerNames.length}</p>
          </div>
          <div>
            <p className="text-xs text-gray-600">תיקים</p>
            <p className="font-bold text-sm text-gray-900 leading-tight">{sortedRecords.length}</p>
          </div>
        </div>
      </div>

      {/* Grouped Customers */}
      <div className="space-y-1">
        {customerNames.map((customerName) => {
          const customerRecords = groupedByCustomer[customerName];
          const customerTotal = customerRecords.reduce((sum, r) => sum + r.collectedAmount, 0);
          const isExpanded = expandedCustomers[customerName] || false;

          return (
            <div key={customerName} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              {/* Header */}
              <button
                onClick={() =>
                  setExpandedCustomers((prev: Record<string, boolean>) => ({
                    ...prev,
                    [customerName]: !prev[customerName],
                  }))
                }
                className="w-full px-3 py-2 flex items-center justify-between hover:bg-gray-50 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-1.5 flex-1 min-w-0">
                  <div className="min-w-0">
                    <p className="font-bold text-gray-900 text-sm truncate">{customerName}</p>
                    <p className="text-xs text-right text-gray-500 leading-tight">
                      {customerRecords.length} תיקים
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 ml-2">
                  <span className="font-bold text-gray-900 text-sm whitespace-nowrap">{formatCurrency(customerTotal)}</span>
                  {isExpanded ? (
                    <ChevronUp className="w-3.5 h-3.5 text-gray-600 flex-shrink-0" />
                  ) : (
                    <ChevronDown className="w-3.5 h-3.5 text-gray-600 flex-shrink-0" />
                  )}
                </div>
              </button>

              {/* Expanded Content */}
              {isExpanded && (
                <div className="bg-gray-50 border-t border-gray-100">
                  {customerRecords.map((record, index) => (
                    <div
                      key={`${record.caseNumber}-${index}`}
                      className={`px-3 py-2 flex items-center justify-between text-xs ${
                        index !== customerRecords.length - 1 ? 'border-b border-gray-100' : ''
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-gray-900 text-xs">תיק #{record.caseNumber}</p>
                          {record.isPartial && (
                            <span className="px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded text-xs font-medium">
                              חלקית
                            </span>
                          )}
                        </div>
                        <p className="text-gray-500 text-xs leading-tight">
                          {new Date(record.collectedAt).toLocaleDateString('he-IL')}
                          {record.collectedBy && ` • ${record.collectedBy}`}
                        </p>
                        {record.notes && (
                          <p className="text-amber-600 text-xs mt-1 italic border-r-2 border-amber-300 pr-2">
                            💬 {record.notes}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-0.5 ml-2">
                        <p className="font-bold text-gray-900 whitespace-nowrap text-xs">{formatCurrency(record.collectedAmount)}</p>
                        {['manager', 'accountant', 'admin'].includes(userRole || '') && (
                          <button
                            onClick={() => onUnmarkCollection(record.caseNumber, record.customerName)}
                            className="px-1 py-0.5 text-xs border border-gray-300 text-gray-600 rounded hover:bg-gray-100 transition-colors whitespace-nowrap"
                            title="בטל גבייה - החזר לדף הגבייה הרגיל"
                          >
                            בטל
                          </button>
                        )}
                        {userRole === 'admin' && (
                          <button
                            onClick={() => onDeleteCollection(record.caseNumber, record.customerName)}
                            className="px-1 py-0.5 text-xs border border-red-200 text-red-600 rounded hover:bg-red-50 transition-colors whitespace-nowrap flex items-center gap-0.5"
                            title="מחק גבייה זו סופית"
                          >
                            <X className="w-2.5 h-2.5" />
                            מחק
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Customer Detail Component
function CustomerDetail({
  customer,
  expandedCases,
  markingCase,
  onBack,
  onToggleCase,
  onOpenCollectionModal,
}: {
  customer: CollectionCustomer;
  expandedCases: Record<string, boolean>;
  markingCase: string | null;
  onBack: () => void;
  onToggleCase: (caseNumber: string) => void;
  onOpenCollectionModal: (caseItem: CollectionCase, customerName: string) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl p-5 shadow-lg">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowRight className="h-5 w-5" />
          חזרה לרשימה
        </button>
        <h2 className=" text-2xl font-bold  mb-2">{customer.customerName}</h2>
        <div className="flex items-center gap-6 text-sm ">
          <span>{customer.totalCases} תיקים</span>
          <span className="font-bold text-lg text-gray-900">{formatCurrency(customer.totalWithVAT)}</span>
        </div>
      </div>

      {/* Cases list */}
      {customer.cases.map((caseItem) => {
        const isExpanded = expandedCases[caseItem.caseNumber];

        return (
          <div key={caseItem.caseNumber} className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div
              onClick={() => onToggleCase(caseItem.caseNumber)}
              className="p-5 cursor-pointer hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-gray-400" />
                  <span className="font-bold text-gray-900">תיק #{caseItem.caseNumber}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-bold text-gray-900">{formatCurrency(caseItem.caseTotalWithVAT)} <span className="text-xs text-gray-500 font-normal">כולל מע״מ</span></span>
                  {isExpanded ? (
                    <ChevronUp className="h-5 w-5 text-gray-400" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-gray-400" />
                  )}
                </div>
              </div>
              <div className="flex items-center gap-6 text-sm text-gray-500">
                {caseItem.expectedArrivalDate && (
                  <span className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {formatDate(caseItem.expectedArrivalDate)}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Package className="h-4 w-4" />
                  {caseItem.items.length} פריטים
                </span>
              </div>
            </div>

            {isExpanded && (
              <div className="border-t border-gray-100 p-5 bg-gray-50">
                <div className="space-y-3 mb-4">
                  {caseItem.items.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between text-sm">
                      <span className="text-gray-700">{item.itemDescription || item.itemCode}</span>
                      <span className="text-gray-600 font-medium">{formatCurrency(item.rowTotal)}</span>
                    </div>
                  ))}
                </div>

                {caseItem.partialRecord && (
                  <div className="mb-3 p-3 bg-amber-50 border border-amber-200 rounded-xl text-sm" dir="rtl">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-amber-800">⚠️ גבייה חלקית</span>
                      <span className="font-bold text-amber-700">
                        שולם: {formatCurrency(caseItem.partialRecord.collectedAmount)}
                      </span>
                    </div>
                    {caseItem.partialRecord.notes && (
                      <p className="text-amber-700 text-xs mt-1 border-r-2 border-amber-300 pr-2">
                        💬 {caseItem.partialRecord.notes}
                      </p>
                    )}
                  </div>
                )}

                <button
                  onClick={() => onOpenCollectionModal(caseItem, customer.customerName)}
                  disabled={markingCase === caseItem.caseNumber}
                  className="w-full py-2 px-3 bg-emerald-500 text-white rounded-lg text-sm font-medium hover:bg-emerald-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {markingCase === caseItem.caseNumber ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      מסמן...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4" />
                      סמן כנגבה
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// Main View Component
export function CollectionModuleView({
  loading,
  error,
  data,
  customers,
  selectedCustomer,
  expandedCases,
  userRole,
  canUpload,
  uploadMode,
  file,
  uploading,
  uploadResult,
  dragActive,
  fileInputRef,
  showRecentCollected,
  dateFrom,
  collectionModal,
  markingCase,
  onBack,
  onLogout,
  onSelectCustomer,
  onToggleCase,
  onOpenCollectionModal,
  onCloseCollectionModal,
  onConfirmCollection,
  onDrag,
  onDrop,
  onFileSelect,
  onUpload,
  onSelectUploadMode,
  onClearFile,
  onToggleRecentCollected,
  onDateFromChange,
  recentCollectedData,
  loadingStats,
  unmarkModal,
  unmarking,
  onUnmarkCollection,
  onCancelUnmark,
  onConfirmUnmark,
  deleteModal,
  deleting,
  onDeleteCollection,
  onCancelDelete,
  onConfirmDelete,
}: CollectionModuleViewProps) {
  const customer = selectedCustomer
    ? customers.find((c) => c.customerName === selectedCustomer)
    : null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-100 via-blue-50 to-gray-100 p-6" dir="rtl">
      <button
        onClick={onLogout}
        className="absolute top-6 left-6 w-12 h-12 bg-red-500 hover:bg-red-600 rounded-xl flex items-center justify-center shadow-lg transition-all"
        aria-label="התנתק"
      >
        <LogOut className="w-6 h-6 text-white" />
      </button>

      <button
        onClick={onBack}
        className="absolute top-6 right-6 flex items-center gap-2 px-4 py-2 bg-white hover:bg-gray-50 rounded-xl text-gray-700 transition-all shadow-lg"
      >
        <ArrowRight className="w-5 h-5" />
        <span className="font-medium">חזרה לתפריט</span>
      </button>

      <div className="max-w-4xl mx-auto pt-8">
        <div className="text-center mb-8">
          <img src="/logoBravo.svg" alt="Bravo Logo" className="h-24 mx-auto mb-6" />
        </div>

        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold">
            <span className="text-gray-700">מצב גבייה</span>
          </h1>
          <p className="text-gray-500 mt-2">{data?.totalCustomers || 0} לקוחות לגבייה</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 rounded-xl border border-red-200">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-6 w-6 text-red-600 flex-shrink-0" />
              <p className="text-red-800 font-medium">{error}</p>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="mb-6 flex items-center justify-center gap-2">
          <button
            onClick={() => {
              if (showRecentCollected) {
                onToggleRecentCollected();
              }
            }}
            className={`px-6 py-2 rounded-lg font-semibold transition-all ${
              !showRecentCollected
                ? 'bg-blue-600 text-white shadow-lg'
                : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            גבייה
          </button>
          {userRole !== 'sales_agent' && (
            <button
              onClick={() => {
                if (!showRecentCollected) {
                  onToggleRecentCollected();
                }
              }}
              className={`px-6 py-2 rounded-lg font-semibold transition-all flex items-center gap-2 ${
                showRecentCollected
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              <History className="h-4 w-4" />
              גבייה בחודש האחרון
            </button>
          )}
        </div>

        {/* Upload & Filter Buttons - show only in Collection tab */}
        {!showRecentCollected ? (
          <div className="mb-6">
            <div className="flex flex-wrap items-center justify-center gap-3">
              {canUpload && (
                <>
                  <button
                    onClick={() => onSelectUploadMode('replace')}
                    className={`px-4 py-2 rounded-xl font-semibold shadow-sm transition-all border ${
                      uploadMode === 'replace'
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    עדכון גבייה (דריסה)
                  </button>
                  <button
                    onClick={() => onSelectUploadMode('append')}
                    className={`px-4 py-2 rounded-xl font-semibold shadow-sm transition-all border ${
                      uploadMode === 'append'
                        ? 'bg-emerald-600 text-white border-emerald-600'
                        : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    הוספת תיקים חדשים
                  </button>
                </>
              )}
            </div>

            {/* Upload Section - shows when mode is selected */}
            {canUpload && uploadMode && (
              <div className="mt-4">
                <UploadSection
                  title={uploadMode === 'replace' ? 'עדכון גבייה (דריסה)' : 'הוספת תיקים חדשים'}
                  description={
                    uploadMode === 'replace'
                      ? 'הקובץ יחליף את כל נתוני הגבייה הקיימים'
                      : 'רק תיקים חדשים יתווספו, תיקים קיימים ידולגו'
                  }
                  onCancel={() => onSelectUploadMode(null)}
                  file={file}
                  uploading={uploading}
                  uploadResult={uploadResult}
                  dragActive={dragActive}
                  fileInputRef={fileInputRef}
                  onDrag={onDrag}
                  onDrop={onDrop}
                  onFileSelect={onFileSelect}
                  onUpload={onUpload}
                  onClearFile={onClearFile}
                />
              </div>
            )}
          </div>
        ) : (
          <div className="mb-6 flex items-center justify-center gap-3">
            <label className="text-sm text-gray-600">מתאריך:</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => onDateFromChange(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        )}

        {loading ? (
          <div className="min-h-[300px] flex items-center justify-center">
            <div className="text-center">
              <Loader2 className="h-12 w-12 text-blue-500 animate-spin mx-auto mb-4" />
              <p className="text-gray-600 font-medium">טוען נתוני גבייה...</p>
            </div>
          </div>
        ) : showRecentCollected ? (
          <div className="flex justify-center">
            <div className="w-full max-w-2xl">
              <RecentCollectedList
                data={recentCollectedData}
                loading={loadingStats}
                dateFrom={dateFrom}
                userRole={userRole}
                onUnmarkCollection={onUnmarkCollection}
                onDeleteCollection={onDeleteCollection}
              />
            </div>
          </div>
        ) : (
          <div className="flex justify-center">
            <div className="w-full max-w-2xl">
              {customer ? (
                <CustomerDetail
                  customer={customer}
                  expandedCases={expandedCases}
                  markingCase={markingCase}
                  onBack={() => onSelectCustomer(null)}
                  onToggleCase={onToggleCase}
                  onOpenCollectionModal={onOpenCollectionModal}
                />
              ) : (
                <CustomerList
                  customers={customers}
                  onSelectCustomer={onSelectCustomer}
                />
              )}
            </div>
          </div>
        )}

        <div className="fixed bottom-6 left-0 right-0 text-center text-sm text-gray-400">
          <p>כל הזכויות שמורות - בראבו מערכות {new Date().getFullYear()} &copy;</p>
        </div>
      </div>

      <CollectionModal
        isOpen={collectionModal.isOpen}
        caseItem={collectionModal.caseItem}
        customerName={collectionModal.customerName}
        onConfirm={onConfirmCollection}
        onCancel={onCloseCollectionModal}
        isLoading={!!markingCase}
      />

      {/* Unmark Collection Confirmation Modal */}
      {unmarkModal.isOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" dir="rtl">
          <div className="bg-white rounded-2xl shadow-2xl overflow-hidden max-w-md w-full">
            <div className="bg-gradient-to-r from-red-50 to-orange-50 p-6 border-b border-red-100">
              <h2 className="text-xl font-bold text-gray-900 text-center">
                בטל גבייה
              </h2>
            </div>

            <div className="p-6 space-y-4">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-sm text-gray-700">
                  אתה בעמדת ביטול הגבייה של:
                </p>
                <p className="font-bold text-gray-900 mt-2">{unmarkModal.customerName}</p>
                <p className="text-sm text-gray-600">תיק #{unmarkModal.caseNumber}</p>
              </div>

              <p className="text-sm text-gray-600 text-center">
                פעולה זו תחזיר את התיק לרשימת הגבייה. האם אתה בטוח?
              </p>
            </div>

            <div className="bg-gray-50 px-6 py-4 flex gap-3">
              <button
                onClick={onCancelUnmark}
                disabled={unmarking}
                className="flex-1 px-4 py-2 border-2 border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
              >
                ביטול
              </button>
              <button
                onClick={onConfirmUnmark}
                disabled={unmarking}
                className="flex-1 px-4 py-2 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
              >
                {unmarking ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    בטל גבייה
                  </>
                ) : (
                  'אישור - בטל גבייה'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Collection Confirmation Modal */}
      {deleteModal.isOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" dir="rtl">
          <div className="bg-white rounded-2xl shadow-2xl overflow-hidden max-w-md w-full">
            <div className="bg-gradient-to-r from-red-100 to-red-50 p-6 border-b border-red-200">
              <h2 className="text-xl font-bold text-gray-900 text-center">
                מחק גבייה סופית
              </h2>
            </div>

            <div className="p-6 space-y-4">
              <div className="bg-red-50 border border-red-300 rounded-lg p-4">
                <p className="text-sm text-gray-700">
                  אתה עומד למחוק סופית את הגבייה של:
                </p>
                <p className="font-bold text-gray-900 mt-2">{deleteModal.customerName}</p>
                <p className="text-sm text-gray-600">תיק #{deleteModal.caseNumber}</p>
              </div>

              <div className="bg-red-50 rounded-lg p-3 border border-red-200">
                <p className="text-xs text-red-700 font-semibold">⚠️ אזהרה</p>
                <p className="text-sm text-red-700 mt-1">
                  פעולה זו אינה ניתנת לביטול. הגבייה תימחק לצמיתות ממסד הנתונים.
                </p>
              </div>

              <p className="text-sm text-gray-600 text-center">
                האם אתה בטוח שברצונך להמשיך?
              </p>
            </div>

            <div className="bg-gray-50 px-6 py-4 flex gap-3">
              <button
                onClick={onCancelDelete}
                disabled={deleting}
                className="flex-1 px-4 py-2 border-2 border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
              >
                ביטול
              </button>
              <button
                onClick={onConfirmDelete}
                disabled={deleting}
                className="flex-1 px-4 py-2 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
              >
                {deleting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    מוחק...
                  </>
                ) : (
                  'אישור - מחק סופית'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


