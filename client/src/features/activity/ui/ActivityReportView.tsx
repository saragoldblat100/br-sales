import { useState } from 'react';
import { ArrowRight, ChevronDown, Loader2 } from 'lucide-react';
import type {
  ActivityReport,
  ActivitySession,
  ActivityCollection,
  ActivityInventorySold,
  ActivityOrder,
  ActivityCustomerView,
  ActivityItemView,
  ActivityVisitSummary,
} from '../api/activity.api';

interface ActivityReportViewProps {
  date: string;
  loading: boolean;
  error: string | null;
  report: ActivityReport | null;
  onDateChange: (date: string) => void;
  onBack: () => void;
}

export function ActivityReportView({
  date,
  loading,
  error,
  report,
  onDateChange,
  onBack,
}: ActivityReportViewProps) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-100 via-blue-50 to-gray-100" dir="rtl">
      {/* Header */}
      <header className="bg-white/90 backdrop-blur-sm shadow-sm sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/icons/reports.svg" alt="" className="w-10 h-10" />
            <h1 className="text-xl font-bold text-gray-800">דוח פעילות סוכנת</h1>
          </div>
          <button
            onClick={onBack}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-all font-medium text-sm"
          >
            <ArrowRight className="h-4 w-4" />
            חזרה
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6">
        {/* Date Picker Card */}
        <div className="bg-white rounded-3xl shadow-xl p-5 mb-6">
          <label className="block text-sm font-bold text-gray-600 mb-2">בחירת תאריך</label>
          <input
            type="date"
            value={date}
            onChange={(e) => onDateChange(e.target.value)}
            className="w-full px-4 py-3 border-2 border-blue-200 rounded-xl text-base focus:border-blue-500 focus:outline-none transition-colors"
          />
        </div>

        {loading && (
          <div className="flex flex-col items-center justify-center py-16">
            <Loader2 className="h-10 w-10 text-blue-500 animate-spin mb-3" />
            <p className="text-gray-500">טוען דוח...</p>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-5 text-red-700 text-center">
            {error}
          </div>
        )}

        {!loading && !error && report && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <CollapsibleCard title="כניסות / יציאות" iconBgColor="bg-blue-50" iconImage="/icons/collection.svg" count={report.sessions.length}>
              {report.sessions.length === 0 ? <EmptyState /> : report.sessions.map((s, i) => <SessionRow key={i} session={s} />)}
            </CollapsibleCard>

            <CollapsibleCard title="גבייה" iconBgColor="bg-green-50" iconImage="/icons/collection.svg" count={report.collections.length}>
              {report.collections.length === 0 ? <EmptyState /> : report.collections.map((c, i) => <CollectionRow key={i} item={c} />)}
            </CollapsibleCard>

            <CollapsibleCard title="מלאי שנמכר" iconBgColor="bg-blue-50" iconImage="/icons/inventory.svg" count={report.inventorySold.length}>
              {report.inventorySold.length === 0 ? <EmptyState /> : report.inventorySold.map((item, i) => <InventoryRow key={i} item={item} />)}
            </CollapsibleCard>

            <CollapsibleCard title="הזמנות" iconBgColor="bg-orange-50" iconImage="/icons/sales-chart.svg" count={report.orders.length}>
              {report.orders.length === 0 ? <EmptyState /> : report.orders.map((o, i) => <OrderRow key={i} item={o} />)}
            </CollapsibleCard>

            <CollapsibleCard title="כניסה ללקוחות" iconBgColor="bg-indigo-50" iconImage="/icons/sales-chart.svg" count={report.customerViews.length}>
              {report.customerViews.length === 0 ? <EmptyState /> : report.customerViews.map((v, i) => <CustomerViewRow key={i} item={v} />)}
            </CollapsibleCard>

            <CollapsibleCard title="סיכום פגישה" iconBgColor="bg-emerald-50" iconImage="/icons/sales-chart.svg" count={report.visitSummaries.length}>
              {report.visitSummaries.length === 0 ? <EmptyState /> : report.visitSummaries.map((v, i) => <VisitSummaryRow key={i} item={v} />)}
            </CollapsibleCard>

            <CollapsibleCard title="צפייה בפריטים" iconBgColor="bg-purple-50" iconImage="/icons/items-update.svg" count={report.itemViews.length}>
              {report.itemViews.length === 0 ? <EmptyState /> : report.itemViews.map((v, i) => <ItemViewRow key={i} item={v} />)}
            </CollapsibleCard>
          </div>
        )}
      </main>
    </div>
  );
}

function CollapsibleCard({ title, iconBgColor, iconImage, count, children }: {
  title: string; iconBgColor: string; iconImage: string; count: number; children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="bg-white rounded-3xl shadow-xl overflow-hidden transition-all">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-4 p-5 hover:bg-gray-50 transition-colors"
      >
        <div className={`w-14 h-14 rounded-full flex items-center justify-center flex-shrink-0 ${iconBgColor}`}>
          <img src={iconImage} alt="" className="w-8 h-8 object-contain" />
        </div>
        <div className="flex-1 text-right">
          <h3 className="text-lg font-bold text-gray-800">{title}</h3>
          <p className="text-sm text-gray-400">{count === 0 ? 'אין נתונים' : `${count} רשומות`}</p>
        </div>
        <div className="flex items-center gap-2">
          {count > 0 && (
            <span className="bg-blue-100 text-blue-700 font-bold rounded-full w-8 h-8 flex items-center justify-center text-sm">
              {count}
            </span>
          )}
          <ChevronDown className={`h-5 w-5 text-gray-400 transition-transform duration-300 ${open ? 'rotate-180' : ''}`} />
        </div>
      </button>

      {open && (
        <div className="border-t border-gray-100 divide-y divide-gray-50">
          {children}
        </div>
      )}
    </div>
  );
}

function EmptyState() {
  return <p className="text-gray-400 text-sm text-center py-6">אין נתונים ליום זה</p>;
}

function SessionRow({ session }: { session: ActivitySession }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 px-5 py-3 text-xs sm:text-sm">
      <div className="flex items-center gap-2 flex-wrap min-w-0">
        <span className="inline-flex items-center bg-green-100 text-green-700 px-2.5 py-1 rounded-full font-medium text-xs">
          כניסה {session.loginTime}
        </span>
        <span className="text-gray-300">←</span>
        <span className={`inline-flex items-center px-2.5 py-1 rounded-full font-medium text-xs ${session.logoutTime ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
          {session.logoutTime ? `יציאה ${session.logoutTime}` : 'עדיין מחוברת'}
        </span>
      </div>
      {session.duration && (
        <span className="text-gray-500 text-xs bg-gray-100 px-2.5 py-1 rounded-full font-medium">{session.duration}</span>
      )}
    </div>
  );
}

function CollectionRow({ item }: { item: ActivityCollection }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 px-5 py-3 text-xs sm:text-sm">
      <div className="min-w-0">
        <span className="font-bold text-gray-800 truncate">{item.customerName}</span>
        <span className="text-gray-300 mx-1.5">|</span>
        <span className="text-gray-500">תיק {item.caseNumber}</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="font-bold text-amber-600">₪{item.collectedAmount?.toLocaleString()}</span>
        <span className="text-gray-400 text-xs">{item.time}</span>
      </div>
    </div>
  );
}

function InventoryRow({ item }: { item: ActivityInventorySold }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 px-5 py-3 text-xs sm:text-sm">
      <span className="font-bold text-gray-800 truncate">{item.itemCode}</span>
      <div className="flex items-center gap-2">
        <span className="bg-emerald-100 text-emerald-700 px-2.5 py-1 rounded-full text-xs font-medium">כמות: {item.soldQuantity}</span>
        <span className="text-gray-400 text-xs">{item.time}</span>
      </div>
    </div>
  );
}

function OrderRow({ item }: { item: ActivityOrder }) {
  const amount = item.totalAmountILS > 0 ? `₪${item.totalAmountILS.toLocaleString()}` : `$${item.totalAmountUSD.toLocaleString()}`;
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 px-5 py-3 text-xs sm:text-sm">
      <div className="min-w-0">
        <span className="font-bold text-gray-800 truncate">{item.customerName}</span>
        <span className="text-gray-300 mx-1.5">|</span>
        <span className="text-gray-500">#{item.orderNumber}</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="font-bold text-red-600">{amount}</span>
        <span className="text-gray-400 text-xs">{item.time}</span>
      </div>
    </div>
  );
}

function CustomerViewRow({ item }: { item: ActivityCustomerView }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 px-5 py-3 text-xs sm:text-sm">
      <span className="font-bold text-gray-800 truncate">{item.customerName}</span>
      <span className="text-gray-400 text-xs">{item.time}</span>
    </div>
  );
}

function VisitSummaryRow({ item }: { item: ActivityVisitSummary }) {
  const summaryText = item.skipped ? 'ללא ביקור אצל לקוח' : item.summary;
  return (
    <div className="flex flex-col gap-2 px-5 py-3 text-xs sm:text-sm">
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-bold text-gray-800 truncate">{item.customerName}</span>
        <span className="text-gray-300">|</span>
        <span className="text-gray-500">{item.customerCode}</span>
        <span className="text-gray-300">|</span>
        <span className="text-gray-400 text-xs">{item.time}</span>
      </div>
      <div className="text-gray-700 bg-emerald-50 border border-emerald-100 rounded-lg px-3 py-2">
        {summaryText || '—'}
      </div>
    </div>
  );
}

function ItemViewRow({ item }: { item: ActivityItemView }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 px-5 py-3 text-xs sm:text-sm">
      <div className="min-w-0">
        <span className="font-bold text-gray-800 truncate">{item.itemCode}</span>
        {item.itemDescription && (
          <>
            <span className="text-gray-300 mx-1.5">|</span>
            <span className="text-gray-500 truncate">{item.itemDescription}</span>
          </>
        )}
      </div>
      <span className="text-gray-400 text-xs">{item.time}</span>
    </div>
  );
}
