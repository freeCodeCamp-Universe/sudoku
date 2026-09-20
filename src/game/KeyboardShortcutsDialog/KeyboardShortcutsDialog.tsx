import { Dialog } from '@/app/Dialog';
import { KbdCombo } from '@/app/KbdCombo/KbdCombo';
import styles from './KeyboardShortcutsDialog.module.css';

export interface ShortcutEntry {
  keys: string[];
  separator?: 'or' | 'and';
  description: string;
}

interface KeyboardShortcutsDialogProps {
  open: boolean;
  onClose: () => void;
  shortcuts: ShortcutEntry[];
}

export function KeyboardShortcutsDialog({
  open,
  onClose,
  shortcuts,
}: KeyboardShortcutsDialogProps) {
  return (
    <Dialog open={open} onClose={onClose} title="Keyboard Shortcuts">
      <table className={styles.table}>
        <tbody>
          {shortcuts.map((s) => (
            <tr key={s.description}>
              <td className={styles.keys}>
                <KbdCombo
                  keys={s.keys}
                  separator={s.separator}
                  showSeparators={Boolean(s.separator)}
                  separateAll
                />
              </td>
              <td className={styles.desc}>{s.description}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <button type="button" className={styles.closeBtn} onClick={onClose}>
        Got it
      </button>
    </Dialog>
  );
}
