import type { ReactNode } from 'react';
import { ArrowRight, LogOut } from 'lucide-react';

interface SalesDashboardViewProps {
  userName: string;
  onBackToMenu: () => void;
  onLogout: () => void;
  customerSearch: ReactNode;
  itemSearch?: ReactNode;
  showItemSearch: boolean;
}

// Note: userName, onBackToMenu, onLogout, customerSearch are used only in customer selection screen

export function SalesDashboardView({
  userName,
  onBackToMenu,
  onLogout,
  customerSearch,
  itemSearch,
  showItemSearch,
}: SalesDashboardViewProps) {
  // Customer selection screen (tablet-optimized, matching main menu style)
  if (!showItemSearch) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-100 via-blue-50 to-gray-100 p-6" dir="rtl">
        {/* Logout button - same position as main menu */}
        <button
          onClick={onLogout}
          className="absolute top-6 left-6 w-12 h-12 bg-red-500 hover:bg-red-600 rounded-xl flex items-center justify-center shadow-lg transition-all"
          aria-label="התנתק"
        >
          <LogOut className="w-6 h-6 text-white" />
        </button>

        {/* Back to menu button */}
        <button
          onClick={onBackToMenu}
          className="absolute top-6 right-6 flex items-center gap-2 px-4 py-2 bg-white hover:bg-gray-50 rounded-xl text-gray-700 transition-all shadow-lg"
        >
          <ArrowRight className="w-5 h-5" />
          <span className="font-medium">חזרה לתפריט</span>
        </button>

        <div className="max-w-4xl mx-auto pt-8">
          {/* Logo */}
          <div className="text-center mb-8">
            <img src="/logoBravo.svg" alt="Bravo Logo" className="h-24 mx-auto mb-6" />
          </div>

          {/* Welcome message */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold">
              <span className="text-gray-700">שלום, </span>
              <span className="text-blue-600">{userName}</span>
            </h1>
            <p className="text-gray-500 mt-2">בחר לקוח להתחלת מכירה</p>
          </div>

          {/* Customer Search Card */}
          <div className="flex justify-center">
            <div className="w-full max-w-md">
              {customerSearch}
            </div>
          </div>

          {/* Footer */}
          <div className="fixed bottom-6 left-0 right-0 text-center text-sm text-gray-400">
            <p>כל הזכויות שמורות - בראבו מערכות {new Date().getFullYear()} &copy;</p>
          </div>
        </div>
      </div>
    );
  }

  // Full dashboard with items - cart is shown as modal from itemSearch
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-100 via-blue-50 to-gray-100" dir="rtl">
      <main className="max-w-7xl mx-auto px-6 py-4">
        {itemSearch}
      </main>
    </div>
  );
}
