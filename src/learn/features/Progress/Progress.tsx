import styles from '@/learn/features/Progress/Progress.module.css';

export interface ProgressProps {
  completed: number;
  total: number;
}

export function Progress({ completed, total }: ProgressProps) {
  return (
    <p className={styles.progress}>
      <span aria-hidden="true">
        {completed}/{total} lessons completed
      </span>
      <span className="sr-only">
        {completed} out of {total} lessons completed
      </span>
    </p>
  );
}
