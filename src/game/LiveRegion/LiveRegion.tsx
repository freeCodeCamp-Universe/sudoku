import { forwardRef } from 'react';
import styles from './LiveRegion.module.css';

export const LiveRegion = forwardRef<HTMLDivElement>(function LiveRegion(_props, ref) {
  return (
    <div
      ref={ref}
      id="grid-announcer"
      role="status"
      aria-live="polite"
      aria-atomic="true"
      className={styles.srOnly}
    />
  );
});
