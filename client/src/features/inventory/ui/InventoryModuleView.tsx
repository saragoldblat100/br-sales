import type { RefObject } from 'react';
import {
  ArrowRight,
  LogOut,
  CheckCircle,
  Loader2,
  AlertCircle,
  Upload,
  FileSpreadsheet,
  X,
  Package,
} from 'lucide-react';
import type {
  InventoryDataResponse,
  InventoryItem,
  InventoryDuplicate,
  UploadMode,
  DuplicateAction,
} from '../api';

export interface InventoryModuleViewProps {
  // Data
  loading: boolean;
  error: string | null;
  data: InventoryDataResponse | null;

  // Upload state
  canUpload: boolean;
  uploadMode: UploadMode | null;
  file: File | null;
  uploading: boolean;
  uploadResult: { success: boolean; message: string } | null;
  dragActive: boolean;
  fileInputRef: RefObject<HTMLInputElement>;
  duplicates: InventoryDuplicate[] | null;
  duplicateActions: Record<string, DuplicateAction>;
  showRecentSold: boolean;

  // Handlers
  onBack: () => void;
  onLogout: () => void;

  // Upload handlers
  onDrag: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
  onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onUpload: () => void;
  onSelectUploadMode: (mode: UploadMode | null) => void;
  onClearFile: () => void;
  onResolveDuplicates: () => void;
  onDuplicateActionChange: (itemCode: string, action: DuplicateAction) => void;
  onCancelDuplicates: () => void;
  onToggleRecentSold: () => void;
  onMarkSold: (itemCode: string) => void;
  soldInputs: Record<string, string>;
  onSoldInputChange: (itemCode: string, value: string) => void;
}

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
  InventoryModuleViewProps,
  'file' | 'uploading' | 'uploadResult' | 'dragActive' | 'fileInputRef' | 'onDrag' | 'onDrop' | 'onFileSelect' | 'onUpload' | 'onClearFile'
> & { title: string; description: string; onCancel: () => void }) {
  return (
    <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
      <div className="flex items-center gap-3 mb-4">
        <Upload className="h-6 w-6 text-gray-600" />
        <div>
          <h3 className="font-bold text-gray-900">{title}</h3>
          <p className="text-sm text-gray-500">{description}</p>
        </div>
        <button
          onClick={onCancel}
          className="ml-auto text-sm text-gray-500 hover:text-gray-700"
        >
          סגור
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
              העלה נתוני מלאי
            </>
          )}
        </button>
      )}
    </div>
  );
}

// Duplicate Resolution Modal
function DuplicateResolutionModal({
  duplicates,
  duplicateActions,
  onDuplicateActionChange,
  onResolve,
  onCancel,
}: {
  duplicates: InventoryDuplicate[];
  duplicateActions: Record<string, DuplicateAction>;
  onDuplicateActionChange: (itemCode: string, action: DuplicateAction) => void;
  onResolve: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-2">פריטים כפולים במלאי</h3>
        <p className="text-sm text-gray-500 mb-4">
          נמצאו פריטים שכבר קיימים במלאי. בחרי עבור כל פריט אם להוסיף כמות או לדלג.
        </p>

        <div className="max-h-80 overflow-y-auto border border-gray-100 rounded-xl">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="px-3 py-2 text-right font-semibold">קוד</th>
                <th className="px-3 py-2 text-right font-semibold">תיאור</th>
                <th className="px-3 py-2 text-right font-semibold">קיים</th>
                <th className="px-3 py-2 text-right font-semibold">חדש</th>
                <th className="px-3 py-2 text-right font-semibold">בחירה</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {duplicates.map((duplicate) => (
                <tr key={duplicate.itemCode}>
                  <td className="px-3 py-2 text-gray-700">{duplicate.itemCode}</td>
                  <td className="px-3 py-2 text-gray-700">{duplicate.itemDescription || '—'}</td>
                  <td className="px-3 py-2 text-gray-600">{duplicate.existingQuantity}</td>
                  <td className="px-3 py-2 text-gray-600">{duplicate.newQuantity}</td>
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-3">
                      <label className="flex items-center gap-1">
                        <input
                          type="radio"
                          name={`dup-${duplicate.itemCode}`}
                          checked={duplicateActions[duplicate.itemCode] === 'add'}
                          onChange={() => onDuplicateActionChange(duplicate.itemCode, 'add')}
                        />
                        הוסף
                      </label>
                      <label className="flex items-center gap-1">
                        <input
                          type="radio"
                          name={`dup-${duplicate.itemCode}`}
                          checked={duplicateActions[duplicate.itemCode] === 'skip'}
                          onChange={() => onDuplicateActionChange(duplicate.itemCode, 'skip')}
                        />
                        דלג
                      </label>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex justify-end gap-2 mt-4">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50"
          >
            ביטול
          </button>
          <button
            onClick={onResolve}
            className="px-4 py-2 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700"
          >
            המשך העלאה
          </button>
        </div>
      </div>
    </div>
  );
}

// Inventory List Component
function InventoryList({
  items,
  canUpload,
  showRecentSold,
  onMarkSold,
  soldInputs,
  onSoldInputChange,
}: {
  items: InventoryItem[];
  canUpload: boolean;
  showRecentSold: boolean;
  onMarkSold: (itemCode: string) => void;
  soldInputs: Record<string, string>;
  onSoldInputChange: (itemCode: string, value: string) => void;
}) {
  const now = Date.now();
  const recentLimitMs = 30 * 24 * 60 * 60 * 1000;
  const filteredItems = showRecentSold
    ? items.filter((item) => {
        const soldQuantity = item.soldQuantity || 0;
        return (
          soldQuantity >= item.quantity &&
          item.soldAt &&
          now - new Date(item.soldAt).getTime() <= recentLimitMs
        );
      })
    : items.filter((item) => {
        const soldQuantity = item.soldQuantity || 0;
        return soldQuantity < item.quantity;
      });

  if (filteredItems.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
        <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
        <h3 className="font-bold text-xl text-gray-900 mb-2">
          {showRecentSold
            ? 'אין פריטים שנמכרו בחודש האחרון'
            : 'אין מלאי'}
        </h3>
        <p className="text-gray-500">
          {showRecentSold
            ? 'אין פריטים שנמכרו במלואם בתקופה האחרונה'
            : 'טרם הועלה קובץ מלאי'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="overflow-x-auto bg-white rounded-2xl shadow-xl border border-gray-100">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 text-gray-700">
            <tr>
              <th className="px-3 py-2 text-right text-base font-bold">קוד</th>
              <th className="px-3 py-2 text-right text-base font-bold">תיאור</th>
              <th className="px-3 py-2 text-right text-base font-bold">צבע</th>
              <th className="px-3 py-2 text-right text-base font-bold">מחיר לקרטון</th>
              <th className="px-3 py-2 text-right text-base font-bold">כמות</th>
              {canUpload && (
                <th className="px-3 py-2 text-right text-base font-bold">סמן נמכר</th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredItems.map((item, idx) => {
              const soldQuantity = item.soldQuantity || 0;
              const isFullySold = soldQuantity >= item.quantity && item.quantity > 0;
              return (
                <tr key={`${item.itemCode}-${idx}`} className="hover:bg-gray-50">
                  <td className="px-3 py-2 whitespace-nowrap text-gray-700">{item.itemCode}</td>
                  <td className="px-3 py-2 text-gray-800">{item.itemDescription || item.itemCode}</td>
                  <td className="px-3 py-2 text-gray-600">{item.color || '—'}</td>
                  <td className="px-3 py-2 text-gray-600">
                    {item.pricePerCarton > 0
                      ? `$${item.pricePerCarton.toLocaleString('he-IL', { minimumFractionDigits: 2 })}`
                      : '—'}
                  </td>
                  <td className="px-3 py-2 text-gray-800 font-semibold">{item.quantity}</td>
                  {canUpload && (
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min={1}
                          value={soldInputs[item.itemCode] || ''}
                          onChange={(e) => onSoldInputChange(item.itemCode, e.target.value)}
                          disabled={isFullySold}
                          className="w-20 border border-gray-200 rounded-lg px-2 py-1 text-sm"
                          placeholder="כמות"
                        />
                        <button
                          onClick={() => onMarkSold(item.itemCode)}
                          disabled={isFullySold}
                          className="px-3 py-1.5 bg-slate-200 text-slate-800 border border-slate-300 rounded-lg text-xs font-semibold hover:bg-slate-300 disabled:opacity-50"
                        >
                          עדכן מכירה
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="text-center text-sm text-gray-400">
        {`סה"כ ${filteredItems.length} פריטים במלאי`}
      </div>
    </div>
  );
}

export function InventoryModuleView({
  loading,
  error,
  data,
  canUpload,
  uploadMode,
  file,
  uploading,
  uploadResult,
  dragActive,
  fileInputRef,
  duplicates,
  duplicateActions,
  showRecentSold,
  onBack,
  onLogout,
  onDrag,
  onDrop,
  onFileSelect,
  onUpload,
  onSelectUploadMode,
  onClearFile,
  onResolveDuplicates,
  onDuplicateActionChange,
  onCancelDuplicates,
  onToggleRecentSold,
  onMarkSold,
  soldInputs,
  onSoldInputChange,
}: InventoryModuleViewProps) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-100 via-blue-50 to-gray-100 p-6" dir="rtl">
      {duplicates && canUpload && (
        <DuplicateResolutionModal
          duplicates={duplicates}
          duplicateActions={duplicateActions}
          onDuplicateActionChange={onDuplicateActionChange}
          onResolve={onResolveDuplicates}
          onCancel={onCancelDuplicates}
        />
      )}

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

      <div className="max-w-6xl mx-auto pt-8">
        <div className="text-center mb-8">
          <img src="/logoBravo.svg" alt="Bravo Logo" className="h-24 mx-auto mb-6" />
        </div>

        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold">
            <span className="text-gray-700">מלאי בארץ</span>
          </h1>
          <p className="text-gray-500 mt-2">{data?.totalItems || 0} פריטים במלאי</p>
          {data?.uploadedAt && (
            <p className="text-xs text-gray-400 mt-1">
              עודכן לאחרונה: {new Date(data.uploadedAt).toLocaleDateString('he-IL')}
              {data.uploadedBy && ` ע"י ${data.uploadedBy}`}
            </p>
          )}
        </div>

        {canUpload && (
          <div className="mb-6">
            <div className="flex flex-wrap items-center justify-center gap-3">
              <button
                onClick={() => onSelectUploadMode('replace')}
                className={`px-4 py-2 rounded-xl font-semibold shadow-sm transition-all border ${
                  uploadMode === 'replace'
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                }`}
              >
                דריסת מלאי קיים
              </button>
              <button
                onClick={() => onSelectUploadMode('append')}
                className={`px-4 py-2 rounded-xl font-semibold shadow-sm transition-all border ${
                  uploadMode === 'append'
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                }`}
              >
                הוספת פריטים על הקיים
              </button>
              {canUpload && (
                <button
                  onClick={onToggleRecentSold}
                  className={`px-4 py-2 rounded-xl font-semibold shadow-sm transition-all border ${
                    showRecentSold
                      ? 'bg-emerald-600 text-white border-emerald-600'
                      : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  פריטים שנמכרו בחודש האחרון
                </button>
              )}
            </div>

            {uploadMode && (
              <div className="mt-4">
                <UploadSection
                  title={uploadMode === 'replace'
                    ? 'דריסת מלאי קיים'
                    : 'הוספת פריטים למלאי קיים'}
                  description={
                    uploadMode === 'replace'
                      ? 'העלאת קובץ Excel תחליף את כל המלאי הקיים'
                      : 'העלאת קובץ Excel תוסיף פריטים על המלאי הקיים'
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
        )}

        {error && (
          <div className="mb-6 p-4 bg-red-50 rounded-xl border border-red-200">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-6 w-6 text-red-600 flex-shrink-0" />
              <p className="text-red-800 font-medium">{error}</p>
            </div>
          </div>
        )}

        {loading ? (
          <div className="min-h-[300px] flex items-center justify-center">
            <div className="text-center">
              <Loader2 className="h-12 w-12 text-blue-500 animate-spin mx-auto mb-4" />
              <p className="text-gray-600 font-medium">טוען נתוני מלאי...</p>
            </div>
          </div>
        ) : (
          <div className="flex justify-center">
            <div className="w-full">
              <InventoryList
                items={data?.items || []}
                canUpload={canUpload}
                showRecentSold={showRecentSold}
                onMarkSold={onMarkSold}
                soldInputs={soldInputs}
                onSoldInputChange={onSoldInputChange}
              />
            </div>
          </div>
        )}

        <div className="fixed bottom-6 left-0 right-0 text-center text-sm text-gray-400">
          <p>כל הזכויות שמורות - בראבו מערכות {new Date().getFullYear()} &copy;</p>
        </div>
      </div>
    </div>
  );
}
