import { LogOut, Wallet, ArrowRight } from 'lucide-react';

export type ManagerModuleId = 'collection' | 'inventory' | 'items' | 'reports' | 'sales' | null;

export interface ManagerModule {
  id: ManagerModuleId;
  title: string;
  description: string;
  icon: typeof Wallet;
  gradient: string;
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-slate-100 flex flex-col" dir="rtl">
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200 shadow-sm">
        <div className="container mx-auto px-4 md:px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img
                src="/logoBravo.svg"
                alt="Bravo Logo"
                className="h-12 md:h-14 w-auto"
              />
              <div className="hidden sm:block">
                <h1 className="text-xl font-bold text-gray-900">Bravo</h1>
                <p className="text-xs text-gray-500">מערכת ניהול</p>
              </div>
            </div>

            <button
              onClick={onLogout}
              className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-all font-medium shadow-lg shadow-red-500/25 text-sm"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">יציאה</span>
            </button>
          </div>
        </div>
      </header>

      <main className="flex-grow flex items-start justify-center px-4 md:px-6 pt-8 md:pt-12">
        <div className="w-full max-w-3xl">
          <div className="text-center mb-8">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-1">
              שלום,{' '}
              <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                {userName}
              </span>
            </h2>
            <p className="text-gray-500 text-sm">בחרי פעולה מהתפריט</p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 md:gap-4">
            {modules.map((module) => {
              const IconComponent = module.icon;
              return (
                <button
                  key={module.id}
                  onClick={() => onSelectModule(module.id)}
                  className="group relative bg-white rounded-2xl p-4 md:p-5 shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border border-gray-100 overflow-hidden"
                >
                  <div
                    className={`absolute inset-0 bg-gradient-to-br ${module.gradient} opacity-0 group-hover:opacity-5 transition-opacity`}
                  />

                  <div
                    className={`w-12 h-12 md:w-14 md:h-14 rounded-xl bg-gradient-to-br ${module.gradient} flex items-center justify-center mx-auto mb-3 shadow-lg group-hover:scale-110 transition-transform`}
                  >
                    <IconComponent className="h-6 w-6 md:h-7 md:w-7 text-white" />
                  </div>

                  <h3 className="font-bold text-gray-900 text-sm md:text-base mb-1">
                    {module.title}
                  </h3>
                  <p className="text-xs text-gray-500 hidden sm:block">{module.description}</p>
                </button>
              );
            })}
          </div>
        </div>
      </main>

      <footer className="bg-white/50 border-t border-gray-200 py-3">
        <div className="container mx-auto px-4 text-center text-gray-400 text-xs">
          <p>&copy; {new Date().getFullYear()} בראבו מערכות טכנולוגיות בע"מ. כל הזכויות שמורות.</p>
        </div>
      </footer>
    </div>
  );
}

// Placeholder view for modules not yet implemented
interface ComingSoonViewProps {
  title: string;
  icon: typeof Wallet;
  onBack: () => void;
}

export function ComingSoonView({ title, icon: Icon, onBack }: ComingSoonViewProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex flex-col" dir="rtl">
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200 shadow-sm sticky top-0 z-40">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gray-500 to-gray-600 flex items-center justify-center">
                <Icon className="h-5 w-5 text-white" />
              </div>
              <h1 className="text-lg font-bold text-gray-900">{title}</h1>
            </div>
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
        <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100 text-center max-w-md">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-gray-400 to-gray-500 flex items-center justify-center mx-auto mb-4 shadow-lg">
            <Icon className="h-8 w-8 text-white" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">{title}</h2>
          <p className="text-amber-600 font-medium">בקרוב...</p>
          <p className="text-gray-500 text-sm mt-2">פיצ'ר זה יהיה זמין בקרוב</p>
        </div>
      </main>
    </div>
  );
}
