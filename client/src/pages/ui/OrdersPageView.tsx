import { Plus, Search, Filter } from 'lucide-react';
import styles from './OrdersPageView.module.scss';

export function OrdersPageView() {
  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>הזמנות</h1>
          <p className={styles.subtitle}>ניהול והיסטוריית הזמנות</p>
        </div>

        <button className={styles.primaryButton}>
          <Plus className={styles.buttonIcon} />
          הזמנה חדשה
        </button>
      </div>

      <div className={styles.card}>
        <div className={styles.cardBody}>
          <div className={styles.searchWrapper}>
            <Search className={styles.searchIcon} />
            <input
              type="text"
              placeholder="חיפוש לפי מספר הזמנה או שם לקוח..."
              className={styles.searchInput}
            />
          </div>

          <select className={styles.select}>
            <option value="">כל הסטטוסים</option>
            <option value="quote">הצעת מחיר</option>
            <option value="order">הזמנה</option>
            <option value="processing">בטיפול</option>
            <option value="shipped">נשלח</option>
            <option value="delivered">נמסר</option>
            <option value="closed">סגור</option>
          </select>

          <button className={styles.secondaryButton}>
            <Filter className={styles.buttonIconSmall} />
            סינון מתקדם
          </button>
        </div>
      </div>

      <div className={styles.card}>
        <div className={styles.cardBody}>
          <p className={styles.placeholder}>אין הזמנות להצגה</p>
        </div>
      </div>
    </div>
  );
}
