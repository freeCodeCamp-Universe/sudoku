import cfg from '@/../donation-config.json';
import { GearIcon, KeyboardIcon } from '@/components/icons';
import { Button } from '@/components/Button';
import styles from '@/learn/Navbar/Navbar.module.css';

export interface NavbarProps {
  onOpenShortcuts: () => void;
  onOpenSettings: () => void;
}

export function Navbar({ onOpenShortcuts, onOpenSettings }: NavbarProps) {
  return (
    <header className={styles.navbar}>
      <a href="/" className={styles.home}>
        Home
      </a>
      <div className={styles.actions}>
        <button
          type="button"
          className={`${styles.action} ${styles['action-keyboard-only']}`}
          onClick={onOpenShortcuts}
          aria-label="keyboard shortcuts"
        >
          <KeyboardIcon />
        </button>
        <button
          type="button"
          className={styles.action}
          onClick={onOpenSettings}
          aria-label="settings"
        >
          <GearIcon />
        </button>
        <Button
          variant="cta"
          href={`https://donate.freecodecamp.org?source=${cfg.donationId}&campaign=Sudoku&medium=web`}
          target_blank
          rel="noopener noreferrer"
        >
          Donate
        </Button>
      </div>
    </header>
  );
}
