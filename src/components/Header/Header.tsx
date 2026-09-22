import { useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { DonateButton } from '@/components/DonateButton';
import { SettingsMenu } from '@/components/SettingsMenu';
import { ThemeToggleButton } from '@/components/ThemeToggleButton';
import { useTheme } from '@/app/ThemeProvider';
import { Toggle } from '@/components/Toggle';
import { GearIcon, HomeIcon, KeyboardIcon } from '@/components/icons';
import { StarIcon } from '@/gallery/StarIcon';
import styles from './Header.module.css';

interface HeaderProps {
  title?: string;
  leading?: ReactNode;
  leadingClassName?: string;
  center?: ReactNode;
  children?: ReactNode;
  contentClassName?: string;
  isFavorite?: boolean;
  onToggleFavorite?: () => void;
  /*
   * Used for landscape mode
   */
  compact?: boolean;
  backHref?: string;
  onBack?: () => void;
  onHelpOpen?: () => void;
  onKeyboardShortcutsOpen?: () => void;
  timer?: ReactNode;
  checkEnabled?: boolean;
  timerEnabled?: boolean;
  highlightPeersEnabled?: boolean;
  navOnLeftEnabled?: boolean;
  onToggleCheck?: () => void;
  onToggleTimer?: () => void;
  onToggleHighlightPeers?: () => void;
  onToggleNavOnLeft?: () => void;
  renderUtilityRow?: boolean;
}

interface HeaderUtilityRowProps {
  timer?: ReactNode;
  onHelpOpen?: () => void;
  modeControl?: ReactNode;
}

interface PuzzleHeaderProps extends HeaderProps {
  title: string;
}

export function Header(props: HeaderProps) {
  if (props.leading !== undefined || props.children !== undefined) {
    return (
      <header className={styles.header}>
        <div
          className={
            props.leadingClassName ? `${styles.leading} ${props.leadingClassName}` : styles.leading
          }
        >
          {props.leading}
        </div>
        <div className={styles.center}>{props.center}</div>
        <div
          className={
            props.contentClassName ? `${styles.content} ${props.contentClassName}` : styles.content
          }
        >
          {props.children}
        </div>
      </header>
    );
  }

  if (!props.title) {
    throw new Error('Header title is required for puzzle headers');
  }

  return <PuzzleHeader {...props} title={props.title} />;
}

export function HeaderUtilityRow({ timer, onHelpOpen, modeControl }: HeaderUtilityRowProps) {
  if (!timer && !onHelpOpen && !modeControl) {
    return null;
  }

  return (
    <div className={styles.utilityRow}>
      {onHelpOpen ? (
        <button
          type="button"
          className={styles.helpBtn}
          aria-label="How to play"
          onClick={onHelpOpen}
        >
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
      {modeControl}
      {timer ? <div className={styles.timerSlot}>{timer}</div> : null}
    </div>
  );
}

function PuzzleHeader({
  title,
  isFavorite = false,
  onToggleFavorite,
  compact = false,
  backHref,
  onBack,
  onHelpOpen,
  onKeyboardShortcutsOpen,
  timer,
  checkEnabled,
  timerEnabled,
  highlightPeersEnabled,
  navOnLeftEnabled,
  onToggleCheck,
  onToggleTimer,
  onToggleHighlightPeers,
  onToggleNavOnLeft,
  renderUtilityRow = true,
}: PuzzleHeaderProps) {
  const { theme, toggleTheme, highContrast, toggleHighContrast } = useTheme();
  const [settingsOpen, setSettingsOpen] = useState(false);

  const hasSettings =
    onToggleCheck !== undefined ||
    onToggleTimer !== undefined ||
    onToggleHighlightPeers !== undefined ||
    onToggleNavOnLeft !== undefined;

  return (
    <>
      <header
        className={
          compact
            ? `${styles.header} ${styles.gameHeader} ${styles.topBarCompact}`
            : `${styles.header} ${styles.gameHeader}`
        }
      >
        {onBack ? (
          <button type="button" className={styles.backBtn} aria-label="Home" onClick={onBack}>
            <HomeIcon width="20" height="20" />
          </button>
        ) : (
          <Link to={backHref ?? '/'} className={styles.backBtn} aria-label="Home">
            <HomeIcon width="20" height="20" />
          </Link>
        )}
        <div className={styles.titleGroup}>
          <h1 className={styles.title}>{title}</h1>
          {onToggleFavorite ? (
            <button
              type="button"
              className={styles.favoriteBtn}
              aria-pressed={isFavorite}
              aria-label={
                isFavorite ? `Remove ${title} from favorites` : `Add ${title} to favorites`
              }
              onClick={onToggleFavorite}
            >
              <StarIcon className={styles.favoriteStar} filled={isFavorite} />
            </button>
          ) : null}
        </div>
        <div className={styles.topBarRight}>
          {hasSettings ? (
            <SettingsMenu
              open={settingsOpen}
              onToggle={() => setSettingsOpen((value) => !value)}
              onClose={() => setSettingsOpen(false)}
              panelId="header-settings-panel"
              buttonClassName={styles.settingsBtn}
              openButtonClassName={styles.open}
              trigger={<GearIcon width="20" height="20" />}
            >
              {compact ? (
                <Toggle
                  id="settings-dark-theme-label"
                  label="Dark theme"
                  checked={theme === 'dark'}
                  onChange={toggleTheme}
                />
              ) : null}
              {onToggleCheck !== undefined ? (
                <Toggle
                  id="settings-check-label"
                  label="Check answers"
                  checked={Boolean(checkEnabled)}
                  onChange={onToggleCheck}
                />
              ) : null}
              {onToggleTimer !== undefined ? (
                <Toggle
                  id="settings-timer-label"
                  label="Timer"
                  checked={Boolean(timerEnabled)}
                  onChange={onToggleTimer}
                />
              ) : null}
              {onToggleHighlightPeers !== undefined ? (
                <Toggle
                  id="settings-highlight-peers-label"
                  label="Highlight peers"
                  checked={Boolean(highlightPeersEnabled)}
                  onChange={onToggleHighlightPeers}
                />
              ) : null}
              {onToggleNavOnLeft !== undefined ? (
                <div className={styles.mobileOnly}>
                  <Toggle
                    id="settings-nav-on-left-label"
                    label="Navigation on left"
                    checked={Boolean(navOnLeftEnabled)}
                    onChange={onToggleNavOnLeft}
                  />
                </div>
              ) : null}
              <Toggle
                id="settings-high-contrast-label"
                label="High contrast"
                checked={highContrast}
                onChange={toggleHighContrast}
              />
            </SettingsMenu>
          ) : null}
          {onKeyboardShortcutsOpen ? (
            <button
              type="button"
              className={`${styles.helpBtn} ${styles.keyboardBtn}`}
              aria-label="Keyboard shortcuts"
              onClick={onKeyboardShortcutsOpen}
            >
              <KeyboardIcon width="20" height="20" />
            </button>
          ) : null}
          {!compact && (
            <div className={styles.themeToggle}>
              <ThemeToggleButton />
            </div>
          )}
          <DonateButton />
        </div>
      </header>
      {renderUtilityRow && (timer || onHelpOpen) ? (
        <div className={styles.utilityRow}>
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
          {timer ? <div className={styles.timerSlot}>{timer}</div> : null}
        </div>
      ) : null}
    </>
  );
}
