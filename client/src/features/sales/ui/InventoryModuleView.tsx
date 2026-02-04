import { ArrowRight, Package } from 'lucide-react';
import styles from './InventoryModuleView.module.scss';

interface InventoryModuleViewProps {
  userName: string;
  onBack: () => void;
}

export function InventoryModuleView({ userName, onBack }: InventoryModuleViewProps) {
  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <div className={styles.headerLeft}>
            <button onClick={onBack} className={styles.backButton}>
              <ArrowRight className={styles.backIcon} />
              <span>חזרה לתפריט</span>
            </button>
            <h1 className={styles.title}>סחורות בארץ</h1>
          </div>
          <div className={styles.userName}>{userName}</div>
        </div>
      </header>

      <main className={styles.main}>
        <div className={styles.card}>
          <div className={styles.iconWrap}>
            <Package className={styles.icon} />
          </div>
          <h2 className={styles.cardTitle}>סחורות בארץ</h2>
          <p className={styles.cardSubtitle}>בקרוב...</p>
          <p className={styles.cardNote}>
            מודול זה יאפשר צפייה במלאי הסחורות בארץ
          </p>
        </div>
      </main>
    </div>
  );
}
