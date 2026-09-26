import cfg from '@/../donation-config.json';
import { SettingsMenu } from '@/components/SettingsMenu';
import { Toggle } from '@/components/Toggle';
import { useTheme } from '@/app/ThemeProvider';
import { ThemeToggleButton } from '@/components/ThemeToggleButton';
import { GearIcon, KeyboardIcon, ListIcon } from '@/components/icons';
import { Button } from '@/components/Button';
import { useInitialFocusPreference } from '@/learn/hooks/useInitialFocusPreference';
import { useShortcutsPreference } from '@/learn/hooks/useShortcutsPreference';
import { useCourseChrome } from '@/learn/stores/courseChromeStore';
import styles from '@/learn/HeaderControls/HeaderControls.module.css';

interface HeaderControlsProps {
  showDrawer?: boolean;
  showShortcuts?: boolean;
  showSettings?: boolean;
  showThemeToggle?: boolean;
  themeToggleDesktopOnly?: boolean;
}

export function HeaderControls({
  showDrawer = true,
  showShortcuts = true,
  showSettings = true,
  showThemeToggle = false,
  themeToggleDesktopOnly = false,
}: HeaderControlsProps) {
  const { openDrawer, openShortcuts, openSettings, closeSettings, settingsOpen } =
    useCourseChrome();
  const { focusInstructionsOnLoad, setFocusInstructionsOnLoad } = useInitialFocusPreference();
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
          panelClassName={styles['settings-panel']}
          buttonClassName={styles.action}
          openButtonClassName={styles.open}
          trigger={<GearIcon />}
        >
          {themeToggleDesktopOnly ? (
            <div className={styles.mobileOnly}>
              <Toggle
                id="learn-settings-dark-theme"
                label="Dark theme"
                checked={theme === 'dark'}
                onChange={toggleTheme}
              />
            </div>
          ) : (
            <Toggle
              id="learn-settings-dark-theme"
              label="Dark theme"
              checked={theme === 'dark'}
              onChange={toggleTheme}
            />
          )}
          <Toggle
            id="learn-settings-shortcuts"
            label="Keyboard shortcuts"
            checked={shortcutsEnabled}
            onChange={() => setShortcutsEnabled(!shortcutsEnabled)}
          />
          <Toggle
            id="learn-settings-focus-instructions"
            label="Focus instructions panel when a lesson starts"
            checked={focusInstructionsOnLoad}
            onChange={() => setFocusInstructionsOnLoad(!focusInstructionsOnLoad)}
          />
          <Toggle
            id="learn-settings-high-contrast"
            label="High contrast"
            checked={highContrast}
            onChange={toggleHighContrast}
          />
        </SettingsMenu>
      ) : null}
      {showThemeToggle ? (
        <span className={themeToggleDesktopOnly ? styles.desktopOnly : undefined}>
          <ThemeToggleButton />
        </span>
      ) : null}
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
