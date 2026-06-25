import { useEffect, useId, useRef } from 'react';
import styles from './OnboardingDialog.module.css';

interface OnboardingDialogProps {
  open: boolean;
  onClose: () => void;
}

export function OnboardingDialog({ open, onClose }: OnboardingDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;

    if (!dialog || typeof dialog.showModal !== 'function') {
      return;
    }

    if (open && !dialog.open) {
      dialog.showModal();
    }

    if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  return (
    <dialog
      ref={dialogRef}
      className={styles.dialog}
      aria-labelledby={titleId}
      onClose={onClose}
      onClick={(event) => {
        if (event.target === dialogRef.current) {
          onClose();
        }
      }}
    >
      <button type="button" className={styles.closeX} aria-label="Close" onClick={onClose}>
        ×
      </button>
      <div className={styles.content}>
        <h2 id={titleId} className={styles.title}>
          Hint: it&apos;s customizable!
        </h2>
        <p className={styles.intro}>
          Use the gear icon in the top right corner to adjust these settings any time:
        </p>
        <dl className={styles.settings}>
          <div className={styles.settingRow}>
            <dt>Check answers</dt>
            <dd>
              On by default. Highlights digits that don&apos;t match the solution. Turn it off for a
              purer challenge.
            </dd>
          </div>
          <div className={styles.settingRow}>
            <dt>Timer</dt>
            <dd>Shows how long you have been playing.</dd>
          </div>
          <div className={styles.settingRow}>
            <dt>Highlight peers</dt>
            <dd>Dims the cells in the same row, column, and box as the selected cell.</dd>
          </div>
        </dl>
        <button type="button" className={styles.closeBtn} onClick={onClose}>
          Got it
        </button>
      </div>
    </dialog>
  );
}
