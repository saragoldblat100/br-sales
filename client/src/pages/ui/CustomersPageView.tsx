import { Search } from 'lucide-react';
import styles from './CustomersPageView.module.scss';

export function CustomersPageView() {
  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>לקוחות</h1>
          <p className={styles.subtitle}>חיפוש וניהול לקוחות</p>
        </div>
      </div>

      <div className={styles.card}>
        <div className={styles.cardBody}>
          <div className={styles.searchWrapper}>
            <Search className={styles.searchIcon} />
            <input
              type="text"
              placeholder="חיפוש לקוח לפי שם, קוד או טלפון..."
              className={styles.searchInput}
            />
          </div>
        </div>
      </div>

      <div className={styles.card}>
        <div className={styles.cardBody}>
          <p className={styles.placeholder}>
            חפש לקוח כדי להציג תוצאות
          </p>
        </div>
      </div>
    </div>
  );
}
