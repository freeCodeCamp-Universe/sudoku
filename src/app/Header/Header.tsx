import { useTheme } from '@/app/ThemeProvider';
import { useRef, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import styles from './Header.module.css';

interface HeaderProps {
  title: string;
  backHref: string;
  onHelpOpen?: () => void;
  checkEnabled?: boolean;
  timerEnabled?: boolean;
  onToggleCheck?: () => void;
  onToggleTimer?: () => void;
}

export function Header({
  title,
  backHref,
  onHelpOpen,
  checkEnabled,
  timerEnabled,
  onToggleCheck,
  onToggleTimer,
}: HeaderProps) {
  const { theme, toggleTheme } = useTheme();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const settingsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (settingsRef.current && !settingsRef.current.contains(e.target as Node)) {
        setSettingsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const hasSettings = onToggleCheck !== undefined || onToggleTimer !== undefined;

  return (
    <header className={styles.topBar}>
      <Link to={backHref} className={styles.backBtn}>
        ← Back
      </Link>
      <h1 className={styles.title}>{title}</h1>
      <div className={styles.topBarRight}>
        {hasSettings ? (
          <div className={styles.settingsWrap} ref={settingsRef}>
            <button
              type="button"
              className={styles.settingsBtn}
              aria-label="Settings"
              onClick={() => setSettingsOpen((v) => !v)}
            >
              ⚙
            </button>
            {settingsOpen ? (
              <div className={styles.dropdown}>
                {onToggleCheck !== undefined ? (
                  <div className={styles.dropdownRow}>
                    <span id="settings-check-label" className={styles.dropdownLabel}>
                      Check answers
                    </span>
                    <span className={styles.toggleControl}>
                      <input
                        type="checkbox"
                        role="switch"
                        className={styles.toggleInput}
                        checked={Boolean(checkEnabled)}
                        aria-labelledby="settings-check-label"
                        onChange={onToggleCheck}
                      />
                      <span
                        aria-hidden="true"
                        className={`${styles.toggleBtn} ${checkEnabled ? styles.on : styles.off}`}
                      >
                        {checkEnabled ? 'On' : 'Off'}
                      </span>
                    </span>
                  </div>
                ) : null}
                {onToggleTimer !== undefined ? (
                  <div className={styles.dropdownRow}>
                    <span id="settings-timer-label" className={styles.dropdownLabel}>
                      Timer
                    </span>
                    <span className={styles.toggleControl}>
                      <input
                        type="checkbox"
                        role="switch"
                        className={styles.toggleInput}
                        checked={Boolean(timerEnabled)}
                        aria-labelledby="settings-timer-label"
                        onChange={onToggleTimer}
                      />
                      <span
                        aria-hidden="true"
                        className={`${styles.toggleBtn} ${timerEnabled ? styles.on : styles.off}`}
                      >
                        {timerEnabled ? 'On' : 'Off'}
                      </span>
                    </span>
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>
        ) : null}
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
