import { Search, Grid, List } from 'lucide-react';
import styles from './ItemsPageView.module.scss';

interface ItemsPageViewProps {
  viewMode: 'grid' | 'list';
  onViewModeChange: (mode: 'grid' | 'list') => void;
}

export function ItemsPageView({ viewMode, onViewModeChange }: ItemsPageViewProps) {
  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>קטלוג פריטים</h1>
          <p className={styles.subtitle}>חיפוש ועיון בפריטים</p>
        </div>

        <div className={styles.viewToggle}>
          <button
            onClick={() => onViewModeChange('grid')}
            className={viewMode === 'grid' ? styles.viewButtonActive : styles.viewButton}
            aria-pressed={viewMode === 'grid'}
          >
            <Grid className={styles.viewIcon} />
          </button>
          <button
            onClick={() => onViewModeChange('list')}
            className={viewMode === 'list' ? styles.viewButtonActive : styles.viewButton}
            aria-pressed={viewMode === 'list'}
          >
            <List className={styles.viewIcon} />
          </button>
        </div>
      </div>

      <div className={styles.card}>
        <div className={styles.cardBody}>
          <div className={styles.searchWrapper}>
            <Search className={styles.searchIcon} />
            <input
              type="text"
              placeholder="חיפוש פריט לפי מק״ט, שם או ברקוד..."
              className={styles.searchInput}
            />
          </div>
          <select className={styles.select}>
            <option value="">כל הקטגוריות</option>
          </select>
        </div>
      </div>

      <div className={styles.card}>
        <div className={styles.cardBody}>
          <p className={styles.placeholder}>
            בחר קטגוריה או חפש פריט להצגת תוצאות
          </p>
        </div>
      </div>
    </div>
  );
}
