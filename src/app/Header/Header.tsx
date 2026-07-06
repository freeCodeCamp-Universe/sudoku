import { useRef, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '@/app/ThemeProvider';
import { ThemeToggleButton } from '@/app/ThemeToggleButton';
import styles from './Header.module.css';

interface HeaderProps {
  title: string;
  backHref: string;
  onHelpOpen?: () => void;
  onKeyboardShortcutsOpen?: () => void;
  checkEnabled?: boolean;
  timerEnabled?: boolean;
  highlightPeersEnabled?: boolean;
  onToggleCheck?: () => void;
  onToggleTimer?: () => void;
  onToggleHighlightPeers?: () => void;
}

export function Header({
  title,
  backHref,
  onHelpOpen,
  onKeyboardShortcutsOpen,
  checkEnabled,
  timerEnabled,
  highlightPeersEnabled,
  onToggleCheck,
  onToggleTimer,
  onToggleHighlightPeers,
}: HeaderProps) {
  const { highContrast, toggleHighContrast } = useTheme();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const settingsRef = useRef<HTMLDivElement>(null);
  const settingsBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (settingsRef.current && !settingsRef.current.contains(e.target as Node)) {
        setSettingsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape' && settingsOpen) {
      setSettingsOpen(false);
      settingsBtnRef.current?.focus();
    }
  };

  const hasSettings =
    onToggleCheck !== undefined ||
    onToggleTimer !== undefined ||
    onToggleHighlightPeers !== undefined;

  return (
    <header className={styles.topBar}>
      <Link to={backHref} className={styles.backBtn}>
        ← Back
      </Link>
      <h1 className={styles.title}>{title}</h1>
      <div className={styles.topBarRight}>
        {hasSettings ? (
          <div className={styles.settingsWrap} ref={settingsRef} onKeyDown={handleKeyDown}>
            <button
              type="button"
              ref={settingsBtnRef}
              className={`${styles.settingsBtn} ${settingsOpen ? styles.open : ''}`}
              aria-label="Settings"
              aria-expanded={settingsOpen}
              aria-controls={settingsOpen ? 'header-settings-panel' : undefined}
              onClick={() => setSettingsOpen((v) => !v)}
            >
              {/* !Font Awesome Free v7.2.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2026 Fonticons, Inc. */}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 640 640"
                width="20"
                height="20"
                fill="currentColor"
                aria-hidden="true"
              >
                <path d="M259.1 73.5C262.1 58.7 275.2 48 290.4 48L350.2 48C365.4 48 378.5 58.7 381.5 73.5L396 143.5C410.1 149.5 423.3 157.2 435.3 166.3L503.1 143.8C517.5 139 533.3 145 540.9 158.2L570.8 210C578.4 223.2 575.7 239.8 564.3 249.9L511 297.3C511.9 304.7 512.3 312.3 512.3 320C512.3 327.7 511.8 335.3 511 342.7L564.4 390.2C575.8 400.3 578.4 417 570.9 430.1L541 481.9C533.4 495 517.6 501.1 503.2 496.3L435.4 473.8C423.3 482.9 410.1 490.5 396.1 496.6L381.7 566.5C378.6 581.4 365.5 592 350.4 592L290.6 592C275.4 592 262.3 581.3 259.3 566.5L244.9 496.6C230.8 490.6 217.7 482.9 205.6 473.8L137.5 496.3C123.1 501.1 107.3 495.1 99.7 481.9L69.8 430.1C62.2 416.9 64.9 400.3 76.3 390.2L129.7 342.7C128.8 335.3 128.4 327.7 128.4 320C128.4 312.3 128.9 304.7 129.7 297.3L76.3 249.8C64.9 239.7 62.3 223 69.8 209.9L99.7 158.1C107.3 144.9 123.1 138.9 137.5 143.7L205.3 166.2C217.4 157.1 230.6 149.5 244.6 143.4L259.1 73.5zM320.3 400C364.5 399.8 400.2 363.9 400 319.7C399.8 275.5 363.9 239.8 319.7 240C275.5 240.2 239.8 276.1 240 320.3C240.2 364.5 276.1 400.2 320.3 400z" />
              </svg>
            </button>
            {settingsOpen ? (
              <div
                id="header-settings-panel"
                className={styles.dropdown}
                role="group"
                aria-label="Settings"
              >
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
                <div className={styles.dropdownRow}>
                  <span id="settings-high-contrast-label" className={styles.dropdownLabel}>
                    High contrast
                  </span>
                  <span className={styles.toggleControl}>
                    <input
                      type="checkbox"
                      role="switch"
                      className={styles.toggleInput}
                      checked={highContrast}
                      aria-labelledby="settings-high-contrast-label"
                      onChange={toggleHighContrast}
                    />
                    <span
                      aria-hidden="true"
                      className={`${styles.toggleBtn} ${highContrast ? styles.on : styles.off}`}
                    >
                      {highContrast ? 'On' : 'Off'}
                    </span>
                  </span>
                </div>
                {onToggleHighlightPeers !== undefined ? (
                  <div className={styles.dropdownRow}>
                    <span id="settings-highlight-peers-label" className={styles.dropdownLabel}>
                      Highlight peers
                    </span>
                    <span className={styles.toggleControl}>
                      <input
                        type="checkbox"
                        role="switch"
                        className={styles.toggleInput}
                        checked={Boolean(highlightPeersEnabled)}
                        aria-labelledby="settings-highlight-peers-label"
                        onChange={onToggleHighlightPeers}
                      />
                      <span
                        aria-hidden="true"
                        className={`${styles.toggleBtn} ${highlightPeersEnabled ? styles.on : styles.off}`}
                      >
                        {highlightPeersEnabled ? 'On' : 'Off'}
                      </span>
                    </span>
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>
        ) : null}
        {onKeyboardShortcutsOpen ? (
          <button
            type="button"
            className={`${styles.helpBtn} ${styles.keyboardBtn}`}
            aria-label="Keyboard shortcuts"
            onClick={onKeyboardShortcutsOpen}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 640 640"
              width="20"
              height="20"
              fill="currentColor"
              aria-hidden="true"
            >
              <path d="M96 128C60.7 128 32 156.7 32 192L32 448C32 483.3 60.7 512 96 512L544 512C579.3 512 608 483.3 608 448L608 192C608 156.7 579.3 128 544 128L96 128zM112 192L144 192C152.8 192 160 199.2 160 208L160 240C160 248.8 152.8 256 144 256L112 256C103.2 256 96 248.8 96 240L96 208C96 199.2 103.2 192 112 192zM96 304C96 295.2 103.2 288 112 288L144 288C152.8 288 160 295.2 160 304L160 336C160 344.8 152.8 352 144 352L112 352C103.2 352 96 344.8 96 336L96 304zM208 192L240 192C248.8 192 256 199.2 256 208L256 240C256 248.8 248.8 256 240 256L208 256C199.2 256 192 248.8 192 240L192 208C192 199.2 199.2 192 208 192zM192 304C192 295.2 199.2 288 208 288L240 288C248.8 288 256 295.2 256 304L256 336C256 344.8 248.8 352 240 352L208 352C199.2 352 192 344.8 192 336L192 304zM208 384L432 384C440.8 384 448 391.2 448 400L448 432C448 440.8 440.8 448 432 448L208 448C199.2 448 192 440.8 192 432L192 400C192 391.2 199.2 384 208 384zM288 208C288 199.2 295.2 192 304 192L336 192C344.8 192 352 199.2 352 208L352 240C352 248.8 344.8 256 336 256L304 256C295.2 256 288 248.8 288 240L288 208zM304 288L336 288C344.8 288 352 295.2 352 304L352 336C352 344.8 344.8 352 336 352L304 352C295.2 352 288 344.8 288 336L288 304C288 295.2 295.2 288 304 288zM384 208C384 199.2 391.2 192 400 192L432 192C440.8 192 448 199.2 448 208L448 240C448 248.8 440.8 256 432 256L400 256C391.2 256 384 248.8 384 240L384 208zM400 288L432 288C440.8 288 448 295.2 448 304L448 336C448 344.8 440.8 352 432 352L400 352C391.2 352 384 344.8 384 336L384 304C384 295.2 391.2 288 400 288zM480 208C480 199.2 487.2 192 496 192L528 192C536.8 192 544 199.2 544 208L544 240C544 248.8 536.8 256 528 256L496 256C487.2 256 480 248.8 480 240L480 208zM496 288L528 288C536.8 288 544 295.2 544 304L544 336C544 344.8 536.8 352 528 352L496 352C487.2 352 480 344.8 480 336L480 304C480 295.2 487.2 288 496 288z" />
            </svg>
          </button>
        ) : null}
        {onHelpOpen ? (
          <button
            type="button"
            className={styles.helpBtn}
            aria-label="How to play"
            onClick={onHelpOpen}
          >
            {/* !Font Awesome Free v7.2.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2026 Fonticons, Inc. */}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 640 640"
              width="20"
              height="20"
              fill="currentColor"
              aria-hidden="true"
            >
              <path d="M224 224C224 171 267 128 320 128C373 128 416 171 416 224C416 266.7 388.1 302.9 349.5 315.4C321.1 324.6 288 350.7 288 392L288 416C288 433.7 302.3 448 320 448C337.7 448 352 433.7 352 416L352 392C352 390.3 352.6 387.9 355.5 384.7C358.5 381.4 363.4 378.2 369.2 376.3C433.5 355.6 480 295.3 480 224C480 135.6 408.4 64 320 64C231.6 64 160 135.6 160 224C160 241.7 174.3 256 192 256C209.7 256 224 241.7 224 224zM320 576C342.1 576 360 558.1 360 536C360 513.9 342.1 496 320 496C297.9 496 280 513.9 280 536C280 558.1 297.9 576 320 576z" />
            </svg>
          </button>
        ) : null}
        <ThemeToggleButton />
      </div>
    </header>
  );
}
