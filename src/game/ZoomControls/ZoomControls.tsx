import styles from './ZoomControls.module.css';

interface ZoomControlsProps {
  onZoomIn(): void;
  onZoomOut(): void;
  onFit(): void;
}

export function ZoomControls({ onZoomIn, onZoomOut, onFit }: ZoomControlsProps) {
  return (
    <div className={styles.controls}>
      <button type="button" className={styles.btn} aria-label="Zoom out" onClick={onZoomOut}>
        −
      </button>
      <button type="button" className={styles.btn} aria-label="Zoom in" onClick={onZoomIn}>
        +
      </button>
      <button
        type="button"
        className={`${styles.btn} ${styles.fit}`}
        aria-label="Fit whole board"
        onClick={onFit}
      >
        Fit
      </button>
    </div>
  );
}
