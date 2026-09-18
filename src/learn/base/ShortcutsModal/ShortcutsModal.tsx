import { KbdCombo } from '@/learn/base/KbdCombo/KbdCombo';
import { Modal } from '@/learn/base/Modal/Modal';
import { useShortcutsPreference } from '@/learn/hooks/useShortcutsPreference';
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

  return (
    <Modal
      open={open}
      onClose={onClose}
      closeLabel="close shortcuts"
      ariaLabelledBy="shortcuts-modal-title"
      panelClassName={styles.panel}
      triggerElement={triggerElement}
    >
      <Modal.Header id="shortcuts-modal-title">Keyboard shortcuts</Modal.Header>
      <Modal.Body>
        <p className={styles.notice}>
          {shortcutsEnabled
            ? 'The following keyboard shortcuts are enabled.'
            : 'These shortcuts are currently off. You can enable them in the settings dialog.'}
        </p>
        <dl className={styles.list}>
          {SHORTCUTS.map((shortcut) => (
            <div key={shortcut.action} className={styles.row}>
              <dt className={styles.keys}>
                <KbdCombo keys={shortcut.keys} separateAll />
              </dt>
              <dd className={styles.action}>{shortcut.action}</dd>
            </div>
          ))}
        </dl>
      </Modal.Body>
    </Modal>
  );
}
