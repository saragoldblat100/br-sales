import { LogOut } from 'lucide-react';

export type SalesModuleId = 'sales' | 'collection' | 'inventory';

export interface SalesMenuModule {
  id: SalesModuleId;
  title: string;
  description: string;
  iconImage: string;
  iconBgColor: string;
}

interface SalesMainMenuViewProps {
  userDisplayName: string;
  modules: SalesMenuModule[];
  onSelectModule: (module: SalesModuleId) => void;
  onLogout: () => void;
  currentYear: number;
}

export function SalesMainMenuView({
  userDisplayName,
  modules,
  onSelectModule,
  onLogout,
  currentYear,
}: SalesMainMenuViewProps) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-100 via-blue-50 to-gray-100 p-6" dir="rtl">
      {/* Logout button */}
      <button
        onClick={onLogout}
        className="absolute top-6 left-6 w-12 h-12 bg-red-500 hover:bg-red-600 rounded-xl flex items-center justify-center shadow-lg transition-all"
        aria-label="התנתק"
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
            <span className="text-blue-600">{userDisplayName}</span>
          </h1>
          <p className="text-gray-500 mt-2"> בחר את המודל הרצוי </p>
        </div>

        {/* Module cards */}
        <div className="flex justify-center gap-6 mt-12">
          {modules.map((module) => (
            <button
              key={module.id}
              onClick={() => onSelectModule(module.id)}
              className="bg-white rounded-3xl p-8 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 min-w-[160px]"
            >
              <div className="flex flex-col items-center gap-4">
                <div className={`w-24 h-24 rounded-full flex items-center justify-center ${module.iconBgColor}`}>
                  <img src={module.iconImage} alt={module.title} className="w-14 h-14 object-contain" />
                </div>
                <h2 className="text-xl font-bold text-gray-800">{module.title}</h2>
              </div>
            </button>
          ))}
        </div>

        {/* Footer */}
        <div className="fixed bottom-6 left-0 right-0 text-center text-sm text-gray-400">
          <p>כל הזכויות שמורות - בראבו מערכות {currentYear} &copy;</p>
        </div>
      </div>
    </div>
  );
}
