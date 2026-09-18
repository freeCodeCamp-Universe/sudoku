import {
  createContext,
  useContext,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';
import { XIcon } from '@/learn/icons';
import { useBodyScrollLock } from '@/learn/hooks/useBodyScrollLock';
import { getFocusableElements } from '@/learn/utils/focusTrap';
import styles from '@/learn/base/Drawer/Drawer.module.css';

interface DrawerContextValue {
  slideFrom: 'start' | 'end' | 'bottom';
  onClose: () => void;
  closeLabel: string;
}

const DrawerContext = createContext<DrawerContextValue>({
  slideFrom: 'start',
  onClose: () => {},
  closeLabel: 'close',
});

export interface DrawerProps {
  /** Whether the drawer is shown. Owned by the parent. */
  open: boolean;
  /** Close the drawer; the parent flips `open` to false. */
  onClose: () => void;
  /** Edge the drawer slides in from. Defaults to the inline start edge. */
  slideFrom?: 'start' | 'end' | 'bottom';
  /** Accessible label for the close button. */
  closeLabel?: string;
  /** Title shown in the drawer header. */
  title: string;
  /** Optional subtitle shown directly below the drawer title. */
  subtitle?: ReactNode;
  /** Optional content shown below the title row inside the sticky header. */
  headerContent?: ReactNode;
  children: ReactNode;
  /** Element to restore focus to on close. */
  triggerElement?: HTMLElement | null;
  /** Element to receive initial focus when the drawer opens. */
  initialFocus?: React.RefObject<HTMLElement | null>;
}

const TRANSITION_MS = 180;

function DrawerRoot({
  open,
  onClose,
  slideFrom = 'start',
  closeLabel = 'close',
  title,
  subtitle,
  headerContent,
  children,
  triggerElement: triggerElementProp,
  initialFocus,
}: DrawerProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLElement | null>(null);
  const [container] = useState(() => document.createElement('div'));
  const [mounted, setMounted] = useState(open);

  useBodyScrollLock(open);

  // Latch the trigger before layout effects run on open.
  if (triggerElementProp) {
    triggerRef.current = triggerElementProp;
  }

  useEffect(() => {
    document.body.appendChild(container);
    return () => {
      container.remove();
    };
  }, [container]);

  useEffect(() => {
    if (open) {
      setMounted(true);
      return;
    }
    if (!mounted) {
      return;
    }
    const timeout = window.setTimeout(() => setMounted(false), TRANSITION_MS);
    return () => window.clearTimeout(timeout);
  }, [open, mounted]);

  useLayoutEffect(() => {
    if (!open) {
      return;
    }

    triggerRef.current = triggerRef.current ?? (document.activeElement as HTMLElement | null);
    const backgrounded: Element[] = [];
    for (const child of Array.from(document.body.children)) {
      if (child !== container && !child.hasAttribute('inert')) {
        child.setAttribute('inert', '');
        backgrounded.push(child);
      }
    }

    const initialTarget = initialFocus?.current;
    if (initialTarget) {
      initialTarget.scrollIntoView?.({ block: 'center', behavior: 'instant' });
      initialTarget.focus({ preventScroll: true });
    } else {
      const firstFocusable = panelRef.current
        ? getFocusableElements(panelRef.current)[0]
        : undefined;
      (firstFocusable ?? panelRef.current)?.focus();
    }

    return () => {
      for (const child of backgrounded) {
        child.removeAttribute('inert');
      }
    };
  }, [container, open, initialFocus]);

  useEffect(() => {
    if (open || !triggerRef.current) {
      return;
    }
    triggerRef.current.focus();
    triggerRef.current = null;
  }, [open]);

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === 'Escape') {
      event.preventDefault();
      onClose();
      return;
    }
    if (event.key !== 'Tab') {
      return;
    }

    const focusables = panelRef.current ? getFocusableElements(panelRef.current) : [];
    if (focusables.length === 0) {
      event.preventDefault();
      panelRef.current?.focus();
      return;
    }

    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    const active = document.activeElement;
    const isFocusInside = active instanceof HTMLElement && panelRef.current?.contains(active);
    if (event.shiftKey && (!isFocusInside || active === first)) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && (!isFocusInside || active === last)) {
      event.preventDefault();
      first.focus();
    }
  }

  const panelClassName = [
    styles.panel,
    slideFrom === 'end' ? styles['panel-end'] : '',
    slideFrom === 'bottom' ? styles['panel-bottom'] : '',
    open ? '' : styles.closing,
  ]
    .filter(Boolean)
    .join(' ');

  const rendered = open || mounted;

  return (
    <DrawerContext.Provider value={{ slideFrom, onClose, closeLabel }}>
      {createPortal(
        rendered ? (
          <div className={styles.overlay}>
            <div
              className={styles.backdrop}
              data-testid="drawer-backdrop"
              onClick={onClose}
              aria-hidden="true"
            />
            <div
              ref={panelRef}
              className={panelClassName}
              role="dialog"
              aria-modal="true"
              aria-labelledby="drawer-title"
              tabIndex={-1}
              onKeyDown={handleKeyDown}
            >
              <DrawerHeader id="drawer-title" subtitle={subtitle} below={headerContent}>
                {title}
              </DrawerHeader>
              {children}
            </div>
          </div>
        ) : null,
        container
      )}
    </DrawerContext.Provider>
  );
}

interface DrawerHeaderProps {
  id: string;
  children: ReactNode;
  subtitle?: ReactNode;
  below?: ReactNode;
}

function DrawerHeader({ id, children, subtitle, below }: DrawerHeaderProps) {
  const { onClose, closeLabel } = useContext(DrawerContext);
  return (
    <div className={styles.header}>
      <div className={styles['header-row']}>
        <div className={styles.heading}>
          <h2 id={id} className={styles.title}>
            {children}
          </h2>
          {subtitle}
        </div>
        <button type="button" className={styles.close} onClick={onClose} aria-label={closeLabel}>
          <XIcon />
        </button>
      </div>
      {below}
    </div>
  );
}

function DrawerBody({ children, className }: { children: ReactNode; className?: string }) {
  const { slideFrom } = useContext(DrawerContext);
  const resolved = [
    styles.body,
    slideFrom === 'bottom' ? styles['body-bottom'] : '',
    className ?? '',
  ]
    .filter(Boolean)
    .join(' ');
  return <div className={resolved}>{children}</div>;
}

function DrawerFooter({ children, className }: { children: ReactNode; className?: string }) {
  const resolved = className ? `${styles.footer} ${className}` : styles.footer;
  return <footer className={resolved}>{children}</footer>;
}

export const Drawer = Object.assign(DrawerRoot, {
  Body: DrawerBody,
  Footer: DrawerFooter,
});
