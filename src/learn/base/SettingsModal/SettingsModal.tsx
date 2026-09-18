import { Modal } from '@/learn/base/Modal/Modal';
import { Switch } from '@/learn/base/Switch/Switch';
import { useAnimationsPreference } from '@/learn/hooks/useAnimationsPreference';
import { useShortcutsPreference } from '@/learn/hooks/useShortcutsPreference';
import { useTheme } from '@/hooks/use-theme';
import styles from '@/learn/base/SettingsModal/SettingsModal.module.css';

export interface SettingsModalProps {
  open: boolean;
  onClose: () => void;
  /** Element to restore focus to on close. Forwarded to Modal. */
  triggerElement?: HTMLElement | null;
}

export function SettingsModal({ open, onClose, triggerElement }: SettingsModalProps) {
  const { animationsEnabled, setAnimationsEnabled } = useAnimationsPreference();
  const { shortcutsEnabled, setShortcutsEnabled } = useShortcutsPreference();
  const { isDark, toggleTheme } = useTheme();

  return (
    <Modal
      open={open}
      onClose={onClose}
      closeLabel="close settings"
      ariaLabelledBy="settings-modal-title"
      panelClassName={styles.panel}
      triggerElement={triggerElement}
    >
      <Modal.Header id="settings-modal-title">Settings</Modal.Header>
      <Modal.Body>
        <Switch
          checked={isDark}
          onChange={() => toggleTheme()}
          label="Enable dark theme"
          labelPosition="end"
          description="When on, the dark theme is used."
        />
        <div className={styles['setting-keyboard-only']}>
          <Switch
            checked={shortcutsEnabled}
            onChange={setShortcutsEnabled}
            label="Enable keyboard shortcuts"
            labelPosition="end"
            description="When on, keyboard shortcuts are active."
          />
        </div>
        <Switch
          checked={animationsEnabled}
          onChange={setAnimationsEnabled}
          label="Enable animations"
          description="When on, animations and transitions are applied."
        />
      </Modal.Body>
    </Modal>
  );
}
