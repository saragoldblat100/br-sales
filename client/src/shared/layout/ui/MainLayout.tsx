import type { ReactNode } from 'react';
import styles from './MainLayout.module.scss';

interface MainLayoutProps {
  sidebar: ReactNode;
  header: ReactNode;
  content: ReactNode;
}

export function MainLayout({ sidebar, header, content }: MainLayoutProps) {
  return (
    <div className={styles.layout}>
      {sidebar}
      <div className={styles.main}>
        {header}
        <main className={styles.content}>{content}</main>
      </div>
    </div>
  );
}
