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
import styles from '@/learn/base/Modal/Modal.module.css';

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  closeLabel: string;
  ariaLabelledBy: string;
  overlayClassName?: string;
  panelClassName?: string;
  children: ReactNode;
  /** Keep the portal content mounted while closed for an exit animation. */
  keepMounted?: boolean;
  /**
   * The element to restore focus to when the modal closes. When provided,
   * overrides the default `document.activeElement` capture. Useful when
   * `document.activeElement` may have shifted by the time the modal's layout
   * effect runs.
   */
  triggerElement?: HTMLElement | null;
  /**
   * Element to receive focus when the modal opens, instead of the first
   * focusable element. The element is scrolled to the center of its scroll
   * container before receiving focus so it lands in view without jumping to the
   * edge. Useful for dialogs where a specific item (e.g. the current lesson in
   * a navigation drawer) is more relevant than the first control.
   */
  initialFocus?: React.RefObject<HTMLElement | null>;
}

interface ModalContextValue {
  onClose: () => void;
  closeLabel: string;
}

const ModalContext = createContext<ModalContextValue | null>(null);

interface ModalHeaderProps {
  id: string;
  children: ReactNode;
  subtitle?: ReactNode;
  below?: ReactNode;
  spacing?: 'normal' | 'wide';
  className?: string;
}

function ModalHeader({
  id,
  children,
  subtitle,
  below,
  spacing = 'normal',
  className: extraClassName,
}: ModalHeaderProps) {
  const context = useContext(ModalContext);
  if (!context) {
    throw new Error('Modal.Header must be used inside Modal.');
  }

  const baseClassName =
    spacing === 'wide' ? `${styles.header} ${styles['header-wide']}` : styles.header;
  const className = extraClassName ? `${baseClassName} ${extraClassName}` : baseClassName;

  return (
    <div className={className}>
      <div className={styles['header-row']}>
        <div className={styles.heading}>
          <h2 id={id} className={styles.title}>
            {children}
          </h2>
          {subtitle}
        </div>
        <button
          type="button"
          className={styles.close}
          onClick={context.onClose}
          aria-label={context.closeLabel}
        >
          <XIcon />
        </button>
      </div>
      {below}
    </div>
  );
}

function ModalBody({ children, className }: { children: ReactNode; className?: string }) {
  const resolved = className ? `${styles.body} ${className}` : styles.body;
  return <div className={resolved}>{children}</div>;
}

function ModalRoot({
  open,
  onClose,
  closeLabel,
  ariaLabelledBy,
  overlayClassName,
  panelClassName,
  children,
  keepMounted = false,
  triggerElement: triggerElementProp,
  initialFocus,
}: ModalProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLElement | null>(null);
  const [container] = useState(() => document.createElement('div'));
  const rendered = open || keepMounted;

  useBodyScrollLock(open);

  // Latch the trigger element whenever a non-null value arrives so the
  // layout effect (which reads the ref on open) gets the right target even
  // when the prop is cleared to null before the render that opens the modal.
  if (triggerElementProp) {
    triggerRef.current = triggerElementProp;
  }

  useEffect(() => {
    document.body.appendChild(container);
    return () => {
      container.remove();
    };
  }, [container]);

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

  // Restore focus to the trigger element after the modal closes. This runs as
  // a passive effect (useEffect) rather than in the layout-effect cleanup
  // because React 19's commit-phase focus management (flushMutationEffects)
  // can re-focus a keepMounted panel between layout-effect cleanup and
  // paint, overriding focus set during cleanup.
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

  return createPortal(
    rendered ? (
      <div className={overlayClassName ? `${styles.overlay} ${overlayClassName}` : styles.overlay}>
        <div
          className={styles.backdrop}
          data-testid="modal-backdrop"
          onClick={onClose}
          aria-hidden="true"
        />
        <div
          ref={panelRef}
          className={panelClassName ? `${styles.panel} ${panelClassName}` : styles.panel}
          role="dialog"
          aria-modal="true"
          aria-labelledby={ariaLabelledBy}
          tabIndex={-1}
          onKeyDown={handleKeyDown}
        >
          <ModalContext.Provider value={{ onClose, closeLabel }}>{children}</ModalContext.Provider>
        </div>
      </div>
    ) : null,
    container
  );
}

export const Modal = Object.assign(ModalRoot, {
  Header: ModalHeader,
  Body: ModalBody,
});
