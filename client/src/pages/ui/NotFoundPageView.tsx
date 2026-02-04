import { Link } from 'react-router-dom';
import { Home, ArrowRight } from 'lucide-react';
import styles from './NotFoundPageView.module.scss';

interface NotFoundPageViewProps {
  onGoBack: () => void;
}

export function NotFoundPageView({ onGoBack }: NotFoundPageViewProps) {
  return (
    <div className={styles.page}>
      <div className={styles.content}>
        <h1 className={styles.code}>404</h1>
        <h2 className={styles.title}>הדף לא נמצא</h2>
        <p className={styles.subtitle}>
          מצטערים, הדף שחיפשת לא קיים או הועבר למקום אחר.
        </p>
        <div className={styles.actions}>
          <Link to="/" className={styles.primaryButton}>
            <Home className={styles.buttonIcon} />
            חזרה לדף הבית
          </Link>
          <button onClick={onGoBack} className={styles.secondaryButton}>
            <ArrowRight className={styles.buttonIcon} />
            חזרה לאחורה
          </button>
        </div>
      </div>
    </div>
  );
}
