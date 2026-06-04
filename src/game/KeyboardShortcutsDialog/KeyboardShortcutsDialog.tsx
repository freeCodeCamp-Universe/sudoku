import { useEffect, useId, useRef } from 'react';
import styles from './KeyboardShortcutsDialog.module.css';

export interface ShortcutEntry {
  keys: string[];
  separator?: 'or';
  description: string;
}

interface KeyboardShortcutsDialogProps {
  open: boolean;
  onClose: () => void;
  shortcuts: ShortcutEntry[];
}

export function KeyboardShortcutsDialog({ open, onClose, shortcuts }: KeyboardShortcutsDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog || typeof dialog.showModal !== 'function') return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={dialogRef}
      className={styles.dialog}
      aria-labelledby={titleId}
      onClose={onClose}
      onClick={(e) => { if (e.target === dialogRef.current) onClose(); }}
    >
      <div className={styles.content}>
        <h2 id={titleId} className={styles.title}>Keyboard Shortcuts</h2>
        <table className={styles.table}>
          <tbody>
            {shortcuts.map((s) => (
              <tr key={s.description}>
                <td className={styles.keys}>
                  {s.keys.map((k, i) => (
                    <span key={k}>
                      {i > 0 && s.separator === 'or' && <span className={styles.sep}>or</span>}
                      <kbd className={styles.kbd}>{k}</kbd>
                    </span>
                  ))}
                </td>
                <td className={styles.desc}>{s.description}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <button type="button" className={styles.closeBtn} onClick={onClose}>Got it</button>
      </div>
    </dialog>
  );
}
