import type { ReactNode } from 'react';
import { XIcon } from '@/learn/icons';
import styles from '@/learn/base/Banner/Banner.module.css';

interface Props {
  children: ReactNode;
  dismissible?: boolean;
  onDismiss?: () => void;
}

export function Banner({ children, dismissible = true, onDismiss }: Props) {
  return (
    <aside className={styles.banner} aria-label="Notice">
      <p className={styles.content}>{children}</p>
      {dismissible && (
        <button type="button" className={styles.dismiss} aria-label="Dismiss" onClick={onDismiss}>
          <XIcon />
        </button>
      )}
    </aside>
  );
}
