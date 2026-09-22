import styles from '@/learn/LoadingState/LoadingState.module.css';

export interface LoadingStateProps {
  label?: string;
  className?: string;
}

export function LoadingState({ label = 'Loading', className }: LoadingStateProps) {
  const containerClassName = [styles.container, className].filter(Boolean).join(' ');

  return (
    <div className={containerClassName} role="status" aria-label={label}>
      <svg className={styles.spinner} viewBox="0 0 56 56" aria-hidden="true" focusable="false">
        <circle
          className={styles['base-ring']}
          cx="28"
          cy="28"
          r="22"
          fill="none"
          strokeWidth="6"
        />
        <circle
          className={styles.arc}
          cx="28"
          cy="28"
          r="22"
          fill="none"
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray="103.67 34.56"
        />
      </svg>
      <span className="sr-only">{label}...</span>
    </div>
  );
}
