import { useState } from 'react';
import styles from './Toolbar.module.css';

interface ToolbarProps {
  onClearAll: () => void;
  onReveal: () => void;
}

export function Toolbar({ onClearAll, onReveal }: ToolbarProps) {
  const [clearConfirmOpen, setClearConfirmOpen] = useState(false);

  return (
    <>
      <div className={styles.buttonRow}>
        <button type="button" className={styles.revealBtn} onClick={onReveal}>
          Reveal Cell
        </button>
        <button
          type="button"
          className={styles.toolBtn}
          onClick={() => setClearConfirmOpen(true)}
          aria-label="Clear All"
        >
          Clear All
        </button>
      </div>

      {clearConfirmOpen ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Clear all entries?"
          className={styles.confirmOverlay}
        >
          <div className={styles.modal}>
            <div className={styles.modalTitle}>Clear all entries?</div>
            <div className={styles.modalSub}>All your entered digits will be removed.</div>
            <div className={styles.modalActions}>
              <button
                type="button"
                className={`${styles.modalBtn} ${styles.primary}`}
                onClick={() => {
                  setClearConfirmOpen(false);
                  onClearAll();
                }}
              >
                Clear All
              </button>
              <button
                type="button"
                className={`${styles.modalBtn} ${styles.secondary}`}
                onClick={() => setClearConfirmOpen(false)}
              >
                Keep Playing
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
