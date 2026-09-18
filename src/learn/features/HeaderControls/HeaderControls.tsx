import cfg from '@/../donation-config.json';
import { GearIcon, KeyboardIcon, ListIcon } from '@/components/base/Icon';
import { Button } from '@/learn/base/Button/Button';
import { useCourseChrome } from '@/learn/stores/courseChromeStore';
import styles from '@/learn/features/HeaderControls/HeaderControls.module.css';

interface HeaderControlsProps {
  showDrawer?: boolean;
  showShortcuts?: boolean;
}

export function HeaderControls({ showDrawer = true, showShortcuts = true }: HeaderControlsProps) {
  const { openDrawer, openShortcuts, openSettings } = useCourseChrome();

  return (
    <div className={styles.actions}>
      {showDrawer && (
        <button type="button" className={styles.action} onClick={openDrawer} aria-label="open lessons">
          <ListIcon />
        </button>
      )}
      {showShortcuts && (
        <button type="button" className={`${styles.action} ${styles['action-keyboard-only']}`} onClick={openShortcuts} aria-label="keyboard shortcuts">
          <KeyboardIcon />
        </button>
      )}
      <button type="button" className={styles.action} onClick={openSettings} aria-label="settings">
        <GearIcon />
      </button>
      <Button variant="cta" href={`https://donate.freecodecamp.org?source=${cfg.donationId}&campaign={{PROJECT_NAME}}&medium=web`} target="_blank" rel="noopener noreferrer">
        Donate
      </Button>
    </div>
  );
}
