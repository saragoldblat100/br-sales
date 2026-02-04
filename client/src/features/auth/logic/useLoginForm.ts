import { useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { useAuth } from '../hooks/useAuth';

/**
 * תרגום הודעות שגיאה לעברית
 */
function translateErrorMessage(error: Error | null): string | undefined {
  if (!error) return undefined;

  const message = error.message.toLowerCase();

  // שגיאות התחברות
  if (message.includes('invalid credentials') || message.includes('wrong password')) {
    return 'שם משתמש או סיסמה שגויים';
  }
  if (message.includes('user not found') || message.includes('no user') || message.includes('user deleted') || message.includes('does not exist')) {
    return 'המשתמש לא נמצא במערכת. ייתכן שהמשתמש הוסר מהמערכת - פנה למנהל';
  }
  if (message.includes('account is not active') || message.includes('inactive')) {
    return 'החשבון אינו פעיל. פנה למנהל המערכת';
  }
  if (message.includes('account locked') || message.includes('blocked')) {
    return 'החשבון נחסם. פנה למנהל המערכת';
  }
  if (message.includes('too many attempts') || message.includes('rate limit')) {
    return 'יותר מדי ניסיונות התחברות. נסה שוב מאוחר יותר';
  }

  // שגיאות רשת
  if (message.includes('network error') || message.includes('failed to fetch')) {
    return 'שגיאת רשת. בדוק את החיבור לאינטרנט';
  }
  if (message.includes('timeout') || message.includes('timed out')) {
    return 'השרת לא מגיב. נסה שוב מאוחר יותר';
  }
  if (message.includes('econnrefused') || message.includes('connection refused')) {
    return 'לא ניתן להתחבר לשרת. נסה שוב מאוחר יותר';
  }

  // שגיאות שרת
  if (message.includes('500') || message.includes('internal server error')) {
    return 'שגיאת שרת. נסה שוב מאוחר יותר';
  }
  if (message.includes('503') || message.includes('service unavailable')) {
    return 'השרת אינו זמין כרגע. נסה שוב מאוחר יותר';
  }

  // שגיאת ברירת מחדל
  return 'אירעה שגיאה בהתחברות. נסה שוב';
}

export function useLoginForm() {
  const { login, isLoggingIn, loginError } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const canSubmit = useMemo(() => {
    return !isLoggingIn && !!username.trim() && !!password.trim();
  }, [isLoggingIn, username, password]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!canSubmit) return;

    try {
      await login({ username, password });
    } catch {
      // Error handled by useAuth
    }
  };

  const errorMessage = useMemo(() => {
    return translateErrorMessage(loginError);
  }, [loginError]);

  return {
    username,
    password,
    showPassword,
    errorMessage,
    isSubmitting: isLoggingIn,
    canSubmit,
    setUsername,
    setPassword,
    togglePassword: () => setShowPassword((prev) => !prev),
    handleSubmit,
  };
}
