import type { ReactNode } from 'react';

interface LoginPageViewProps {
  loginForm: ReactNode;
  currentYear: number;
}

interface LoginPageLoadingProps {
  label?: string;
}

export function LoginPageView({ loginForm, currentYear }: LoginPageViewProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-blue-100 via-blue-50 to-gray-100 p-4" dir="rtl">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <img src="/logoBravo.svg" alt="Bravo Logo" className="h-28 mx-auto mb-6" />
          <h1 className="text-3xl font-bold text-gray-800">מערכת לניהול מכירות</h1>
          {/* <p className="text-gray-500 mt-2">הזן את פרטי המשתמש שלך</p> */}
        </div>

        <div className="bg-white rounded-3xl shadow-2xl p-8">
          <div className="text-center mb-6">
            <h2 className="text-xl font-bold text-gray-800">התחברות</h2>
            <p className="text-gray-400 text-sm mt-1">הזן את פרטי המשתמש שלך</p>
          </div>
          {loginForm}
        </div>

        <p className="text-center text-sm text-gray-400 mt-8">
          כל הזכויות שמורות - בראבו מערכות טכנולוגיות {currentYear}  &copy;
        </p>
      </div>
    </div>
  );
}

export function LoginPageLoading({ label = 'טוען...' }: LoginPageLoadingProps) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50" aria-busy="true" aria-live="polite">
      <div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin" />
      <span className="mt-4 text-gray-600">{label}</span>
    </div>
  );
}
