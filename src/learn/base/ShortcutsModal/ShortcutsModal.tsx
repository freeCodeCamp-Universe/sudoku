import { useAltLabel } from '@/hooks/usePlatformModifier';
import { useShortcutsPreference } from '@/learn/hooks/useShortcutsPreference';
import { Dialog } from '@/components/Dialog';
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

const SHORTCUTS: Shortcut[] = [{ keys: ['Alt', '/'], action: 'show keyboard shortcuts dialog' }];

export function ShortcutsModal({ open, onClose, triggerElement }: ShortcutsModalProps) {
  const { shortcutsEnabled } = useShortcutsPreference();
  const altLabel = useAltLabel();

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Keyboard Shortcuts"
      closeLabel="close shortcuts"
      triggerElement={triggerElement}
    >
      <p className={styles.notice}>
        {shortcutsEnabled
          ? 'The following keyboard shortcuts are enabled.'
          : 'These shortcuts are currently off. You can enable them in the settings dialog.'}
      </p>
      <table className={styles.table}>
        <tbody>
          {SHORTCUTS.map((shortcut) => (
            <tr key={shortcut.action}>
              <td className={styles.keys}>
                {shortcut.keys.map((key, index) => (
                  <span key={`${key}-${index}`}>
                    {index > 0 && <span className={styles.sep}>+</span>}
                    <kbd className={styles.kbd}>{key === 'Alt' ? altLabel : key}</kbd>
                  </span>
                ))}
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
