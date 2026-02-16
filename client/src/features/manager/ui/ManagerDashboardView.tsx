import { LogOut, ArrowRight } from 'lucide-react';

export type ManagerModuleId = 'collection' | 'inventory' | 'items' | 'reports' | 'sales' | 'users' | 'pricing' | 'orders' | null;

export interface ManagerModule {
  id: ManagerModuleId;
  title: string;
  description: string;
  iconImage: string;
  iconBgColor: string;
}

interface ManagerDashboardViewProps {
  userName: string;
  modules: ManagerModule[];
  onSelectModule: (id: ManagerModuleId) => void;
  onLogout: () => void;
}

export function ManagerDashboardView({
  userName,
  modules,
  onSelectModule,
  onLogout,
}: ManagerDashboardViewProps) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-100 via-blue-50 to-gray-100 p-6" dir="rtl">
      {/* Logout button */}
      <button
        onClick={onLogout}
        className="absolute top-6 left-6 w-12 h-12 bg-red-500 hover:bg-red-600 rounded-xl flex items-center justify-center shadow-lg transition-all"
        aria-label="התנתקי"
      >
        <LogOut className="w-6 h-6 text-white" />
      </button>

      <div className="max-w-4xl mx-auto pt-8">
        {/* Logo */}
        <div className="text-center mb-8">
          <img src="/logoBravo.svg" alt="Bravo Logo" className="h-24 mx-auto mb-6" />
        </div>

        {/* Welcome message */}
        <div className="text-center mb-4">
          <h1 className="text-3xl font-bold">
            <span className="text-gray-700">שלום, </span>
            <span className="text-blue-600">{userName}</span>
          </h1>
          <p className="text-gray-500 mt-2">בחרי את המודול הרצוי</p>
        </div>

        {/* Module cards */}
        <div className="flex flex-wrap justify-center gap-6 mt-12">
          {modules.map((module) => (
            <button
              key={module.id}
              onClick={() => onSelectModule(module.id)}
              className="w-52 h-52 bg-white rounded-3xl p-8 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 flex flex-col items-center justify-center"
            >
              <div className="flex flex-col items-center gap-4">
                <div className={`w-24 h-24 rounded-full flex items-center justify-center ${module.iconBgColor}`}>
                  <img src={module.iconImage} alt={module.title} className="w-14 h-14 object-contain" />
                </div>
                <h2 className="text-xl font-bold text-gray-800 text-center">{module.title}</h2>
              </div>
            </button>
          ))}
        </div>

        {/* Footer */}
        <div className="fixed bottom-6 left-0 right-0 text-center text-sm text-gray-400">
          <p>כל הזכויות שמורות - בראבו מערכות {new Date().getFullYear()} &copy;</p>
        </div>
      </div>
    </div>
  );
}

// Placeholder view for modules not yet implemented
interface ComingSoonViewProps {
  title: string;
  onBack: () => void;
}

export function ComingSoonView({ title, onBack }: ComingSoonViewProps) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-100 via-blue-50 to-gray-100 flex flex-col" dir="rtl">
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200 shadow-sm sticky top-0 z-40">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <h1 className="text-lg font-bold text-gray-900">{title}</h1>
            <button
              onClick={onBack}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-all font-medium text-sm"
            >
              <ArrowRight className="h-4 w-4" />
              חזרה
            </button>
          </div>
        </div>
      </header>

      <main className="flex-grow flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-xl p-10 text-center max-w-md">
          <h2 className="text-2xl font-bold text-gray-900 mb-3">{title}</h2>
          <p className="text-amber-600 font-medium text-lg">בקרוב...</p>
          <p className="text-gray-500 text-sm mt-2">פיצ'ר זה יהיה זמין בקרוב</p>
        </div>
      </main>
    </div>
  );
}
