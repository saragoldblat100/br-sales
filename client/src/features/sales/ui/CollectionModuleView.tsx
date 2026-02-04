import { ArrowRight, Wallet } from 'lucide-react';
import styles from './CollectionModuleView.module.scss';

interface CollectionModuleViewProps {
  userName: string;
  onBack: () => void;
}

export function CollectionModuleView({ userName, onBack }: CollectionModuleViewProps) {
  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <div className={styles.headerLeft}>
            <button onClick={onBack} className={styles.backButton}>
              <ArrowRight className={styles.backIcon} />
              <span>חזרה לתפריט</span>
            </button>
            <h1 className={styles.title}>גבייה</h1>
          </div>
          <div className={styles.userName}>{userName}</div>
        </div>
      </header>

      <main className={styles.main}>
        <div className={styles.card}>
          <div className={styles.iconWrap}>
            <Wallet className={styles.icon} />
          </div>
          <h2 className={styles.cardTitle}>מודול גבייה</h2>
          <p className={styles.cardSubtitle}>בקרוב...</p>
          <p className={styles.cardNote}>
            מודול זה יאפשר ניהול גבייה מלקוחות
          </p>
        </div>
      </main>
    </div>
  );
}
