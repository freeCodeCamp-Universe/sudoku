import { useEffect, useRef, type ReactNode } from 'react';
import styles from './SettingsMenu.module.css';

export interface SettingsMenuProps {
  open: boolean;
  onToggle: () => void;
  onClose: () => void;
  buttonLabel?: string;
  panelLabel?: string;
  panelId: string;
  buttonClassName: string;
  openButtonClassName?: string;
  children: ReactNode;
  trigger: ReactNode;
}

export function SettingsMenu({
  open,
  onToggle,
  onClose,
  buttonLabel = 'Settings',
  panelLabel = 'Settings',
  panelId,
  buttonClassName,
  openButtonClassName,
  children,
  trigger,
}: SettingsMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  function handleKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    if (event.key === 'Escape' && open) {
      event.preventDefault();
      onClose();
      buttonRef.current?.focus();
    }
  }

  const buttonClassNameWithState =
    open && openButtonClassName ? `${buttonClassName} ${openButtonClassName}` : buttonClassName;

  return (
    <div ref={menuRef} className={styles.wrapper} onKeyDown={handleKeyDown}>
      <button
        ref={buttonRef}
        type="button"
        className={buttonClassNameWithState}
        aria-label={buttonLabel}
        aria-expanded={open}
        aria-controls={open ? panelId : undefined}
        onClick={onToggle}
      >
        {trigger}
      </button>
      {open ? (
        <div id={panelId} className={styles.panel} role="group" aria-label={panelLabel}>
          {children}
        </div>
      ) : null}
    </div>
  );
}
