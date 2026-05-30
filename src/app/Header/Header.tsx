import { useTheme } from '@/app/ThemeProvider';
import styles from './Header.module.css';

interface HeaderProps {
  title: string;
  backHref: string;
  onHelpOpen?: () => void;
}

export function Header({ title, backHref, onHelpOpen }: HeaderProps) {
  const { theme, toggleTheme } = useTheme();

  return (
    <header className={styles.topBar}>
      <a href={backHref} className={styles.backBtn}>
        ← Back
      </a>
      <h1 className={styles.title}>{title}</h1>
      <div className={styles.topBarRight}>
        {onHelpOpen ? (
          <button
            type="button"
            className={styles.helpBtn}
            aria-label="How to play"
            onClick={onHelpOpen}
          >
            ?
          </button>
        ) : null}
        <button
          type="button"
          className={styles.themeBtn}
          aria-label={theme === 'light' ? 'Switch to dark theme' : 'Switch to light theme'}
          onClick={toggleTheme}
        >
          {theme === 'light' ? '☽' : '☼'}
        </button>
      </div>
    </header>
  );
}
