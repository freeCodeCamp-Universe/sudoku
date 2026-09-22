import { useShortcutsPreference } from '@/learn/hooks/useShortcutsPreference';
import { Dialog } from '@/components/Dialog';
import { KbdCombo } from '@/components/KbdCombo';
import styles from '@/learn/ShortcutsModal/ShortcutsModal.module.css';

export interface ShortcutsModalProps {
  open: boolean;
  onClose: () => void;
  triggerElement?: HTMLElement | null;
}

interface Shortcut {
  keys: string[];
  action: string;
}

const SHORTCUTS: Shortcut[] = [
  { keys: ['Shift', 'P'], action: 'Go to the previous lesson' },
  { keys: ['Shift', 'N'], action: 'Go to the next lesson' },
  { keys: ['Shift', '1'], action: 'Focus the instruction panel' },
  { keys: ['Shift', '2'], action: 'Focus the interactive panel' },
];

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
