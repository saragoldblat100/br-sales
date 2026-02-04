import type { FormEvent } from 'react';
import { LogIn, Eye, EyeOff, AlertCircle, User } from 'lucide-react';

interface LoginFormProps {
  username: string;
  password: string;
  showPassword: boolean;
  errorMessage?: string;
  isSubmitting: boolean;
  canSubmit: boolean;
  onUsernameChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onTogglePassword: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}

export function LoginForm({
  username,
  password,
  showPassword,
  errorMessage,
  isSubmitting,
  canSubmit,
  onUsernameChange,
  onPasswordChange,
  onTogglePassword,
  onSubmit,
}: LoginFormProps) {
  return (
    <form onSubmit={onSubmit} className="space-y-5">
      {errorMessage && (
        <div className="flex items-start gap-3 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium">שגיאת התחברות</p>
            <p className="text-sm mt-1">{errorMessage}</p>
          </div>
        </div>
      )}

      <div>
        <label htmlFor="username" className="block text-sm font-medium text-gray-600 mb-2 text-right">
          שם המשתמש
        </label>
        <div className="relative">
          <input
            id="username"
            type="text"
            value={username}
            onChange={(event) => onUsernameChange(event.target.value)}
            className="w-full px-4 py-3.5 pr-12 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:border-red-400 focus:ring-2 focus:ring-red-100 outline-none transition-all text-right"
            placeholder="הכנס שם משתמש"
            autoComplete="username"
            required
            disabled={isSubmitting}
          />
          <User className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        </div>
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-medium text-gray-600 mb-2 text-right">
          הוכס סיסמה
        </label>
        <div className="relative">
          <input
            id="password"
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(event) => onPasswordChange(event.target.value)}
            className="w-full px-12 py-3.5 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:border-red-400 focus:ring-2 focus:ring-red-100 outline-none transition-all text-right"
            placeholder="הכנס סיסמה"
            autoComplete="current-password"
            required
            disabled={isSubmitting}
          />
          <button
            type="button"
            onClick={onTogglePassword}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
            aria-label={showPassword ? 'הסתר סיסמה' : 'הצג סיסמה'}
          >
            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
        </div>
      </div>

      <button
        type="submit"
        disabled={!canSubmit}
        className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-l from-red-400 to-red-500 text-white font-medium rounded-xl hover:from-red-500 hover:to-red-600 focus:ring-4 focus:ring-red-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-red-200"
      >
        {isSubmitting ? (
          <>
            <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            מתחבר...
          </>
        ) : (
          <>
            <LogIn className="w-5 h-5" />
            התחבר
          </>
        )}
      </button>
    </form>
  );
}
