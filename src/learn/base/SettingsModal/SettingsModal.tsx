import { Toggle } from '@/app/Toggle/Toggle';
import { useAnimationsPreference } from '@/learn/hooks/useAnimationsPreference';
import { useShortcutsPreference } from '@/learn/hooks/useShortcutsPreference';
import { useTheme } from '@/app/ThemeProvider';
import { Dialog } from '@/app/Dialog';
import styles from '@/learn/base/SettingsModal/SettingsModal.module.css';

export interface SettingsModalProps {
  open: boolean;
  onClose: () => void;
  /** Element to restore focus to on close. Forwarded to Dialog. */
  triggerElement?: HTMLElement | null;
}

export function SettingsModal({ open, onClose, triggerElement }: SettingsModalProps) {
  const { animationsEnabled, setAnimationsEnabled } = useAnimationsPreference();
  const { shortcutsEnabled, setShortcutsEnabled } = useShortcutsPreference();
  const { theme, toggleTheme } = useTheme();

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Settings"
      closeLabel="close settings"
      className={styles.panel}
      triggerElement={triggerElement}
    >
      <Toggle
        checked={theme === 'dark'}
        onChange={() => toggleTheme()}
        label="Enable dark theme"
        description="When on, the dark theme is used."
      />
      <div className={styles['setting-keyboard-only']}>
        <Toggle
          checked={shortcutsEnabled}
          onChange={() => setShortcutsEnabled(!shortcutsEnabled)}
          label="Enable keyboard shortcuts"
          description="When on, keyboard shortcuts are active."
        />
      </div>
      <Toggle
        checked={animationsEnabled}
        onChange={() => setAnimationsEnabled(!animationsEnabled)}
        label="Enable animations"
        description="When on, animations and transitions are applied."
      />
    </Dialog>
  );
}
