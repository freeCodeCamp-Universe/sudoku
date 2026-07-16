import { useState } from 'react';
import { Button } from '@/game/Button';
import { Dialog } from '@/game/Dialog';
import styles from './Toolbar.module.css';

interface ToolbarProps {
  onClearAll: () => void;
  onReveal: () => void;
  vertical?: boolean;
}

export function Toolbar({ onClearAll, onReveal, vertical = false }: ToolbarProps) {
  const [clearConfirmOpen, setClearConfirmOpen] = useState(false);

  return (
    <>
      <div className={`${styles.buttonRow}${vertical ? ` ${styles.buttonRowVertical}` : ''}`}>
        <Button
          accent="yellow"
          className={vertical ? styles.fullWidth : undefined}
          onClick={onReveal}
        >
          Reveal Cell
        </Button>
        <Button
          className={vertical ? styles.fullWidth : undefined}
          onClick={() => setClearConfirmOpen(true)}
          aria-label="Clear All"
        >
          Clear All
        </Button>
      </div>

      <Dialog
        open={clearConfirmOpen}
        onClose={() => setClearConfirmOpen(false)}
        title="Clear all entries?"
      >
        <div className={styles.modalBody}>
          <div className={styles.modalSub}>All your entered symbols will be removed.</div>
          <div className={styles.modalActions}>
            <button
              type="button"
              className={`${styles.modalBtn} ${styles.primary}`}
              onClick={() => {
                onClearAll();
                setClearConfirmOpen(false);
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
      </Dialog>
    </>
  );
}
