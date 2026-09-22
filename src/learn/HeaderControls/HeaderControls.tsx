import cfg from '@/../donation-config.json';
import { SettingsMenu } from '@/components/SettingsMenu';
import { Toggle } from '@/components/Toggle';
import { useTheme } from '@/app/ThemeProvider';
import { ThemeToggleButton } from '@/components/ThemeToggleButton';
import { GearIcon, KeyboardIcon, ListIcon } from '@/components/icons';
import { Button } from '@/components/Button';
import { useAnimationsPreference } from '@/learn/hooks/useAnimationsPreference';
import { useShortcutsPreference } from '@/learn/hooks/useShortcutsPreference';
import { useCourseChrome } from '@/learn/stores/courseChromeStore';
import styles from '@/learn/HeaderControls/HeaderControls.module.css';

interface HeaderControlsProps {
  showDrawer?: boolean;
  showShortcuts?: boolean;
  showSettings?: boolean;
  showThemeToggle?: boolean;
}

export function HeaderControls({
  showDrawer = true,
  showShortcuts = true,
  showSettings = true,
  showThemeToggle = false,
}: HeaderControlsProps) {
  const { openDrawer, openShortcuts, openSettings, closeSettings, settingsOpen } =
    useCourseChrome();
  const { animationsEnabled, setAnimationsEnabled } = useAnimationsPreference();
  const { shortcutsEnabled, setShortcutsEnabled } = useShortcutsPreference();
  const { theme, toggleTheme, highContrast, toggleHighContrast } = useTheme();

  return (
    <div className={styles.actions}>
      {showDrawer && (
        <button
          type="button"
          className={styles.action}
          onClick={openDrawer}
          aria-label="Open lessons"
        >
          <ListIcon />
        </button>
      )}
      {showShortcuts && (
        <button
          type="button"
          className={`${styles.action} ${styles['action-keyboard-only']}`}
          onClick={openShortcuts}
          aria-label="Keyboard shortcuts"
        >
          <KeyboardIcon />
        </button>
      )}
      {showSettings ? (
        <SettingsMenu
          open={settingsOpen}
          onToggle={() => (settingsOpen ? closeSettings() : openSettings())}
          onClose={closeSettings}
          panelId="learn-settings-panel"
          buttonClassName={styles.action}
          openButtonClassName={styles.open}
          trigger={<GearIcon />}
        >
          <Toggle
            id="learn-settings-dark-theme"
            label="Dark theme"
            checked={theme === 'dark'}
            onChange={toggleTheme}
          />
          <Toggle
            id="learn-settings-shortcuts"
            label="Keyboard shortcuts"
            checked={shortcutsEnabled}
            onChange={() => setShortcutsEnabled(!shortcutsEnabled)}
          />
          <Toggle
            id="learn-settings-animations"
            label="Animations"
            checked={animationsEnabled}
            onChange={() => setAnimationsEnabled(!animationsEnabled)}
          />
          <Toggle
            id="learn-settings-high-contrast"
            label="High contrast"
            checked={highContrast}
            onChange={toggleHighContrast}
          />
        </SettingsMenu>
      ) : null}
      {showThemeToggle ? <ThemeToggleButton /> : null}
      <Button
        variant="cta"
        href={`https://donate.freecodecamp.org?source=${cfg.donationId}&campaign=Sudoku&medium=web`}
        target_blank
      >
        Donate
      </Button>
    </div>
  );
}
