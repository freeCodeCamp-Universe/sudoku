import { useShortcutsPreference } from '@/learn/hooks/useShortcutsPreference';
import { Dialog } from '@/components/Dialog';
import { KbdCombo } from '@/components/KbdCombo';
import styles from '@/learn/base/ShortcutsModal/ShortcutsModal.module.css';

export interface ShortcutsModalProps {
  open: boolean;
  onClose: () => void;
  triggerElement?: HTMLElement | null;
}

interface Shortcut {
  keys: string[];
  action: string;
}

const SHORTCUTS: Shortcut[] = [{ keys: ['Alt', '/'], action: 'Show keyboard shortcuts dialog' }];

export function ShortcutsModal({ open, onClose, triggerElement }: ShortcutsModalProps) {
  const { shortcutsEnabled } = useShortcutsPreference();

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Keyboard Shortcuts"
      closeLabel="close shortcuts"
      triggerElement={triggerElement}
    >
      {!shortcutsEnabled && (
        <p className={styles.notice}>
          These shortcuts are currently off. You can enable them in the settings dialog.
        </p>
      )}
      <table className={styles.table}>
        <tbody>
          {SHORTCUTS.map((shortcut) => (
            <tr key={shortcut.action}>
              <td className={styles.keys}>
                <KbdCombo keys={shortcut.keys} separateAll />
              </td>
              <td className={styles.desc}>{shortcut.action}</td>
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
