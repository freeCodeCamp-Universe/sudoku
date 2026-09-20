import { useEffect, useId, useRef, type KeyboardEvent, type ReactNode } from 'react';
import styles from './Dialog.module.css';

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled]):not([aria-disabled="true"])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(', ');

let lockCount = 0;
let previousOverflow = '';

interface DialogBaseProps {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  /** Show the top-corner close button. Defaults to `true`. */
  showCloseX?: boolean;
  /** Accessible label for the top-corner close button. */
  closeLabel?: string;
  /** Dismiss when the backdrop (the dialog's own padding area) is clicked. Defaults to `true`. */
  closeOnBackdrop?: boolean;
  /** Per-dialog width and content overrides, merged onto the shared dialog class. */
  className?: string;
  /** Element to restore focus to after the dialog closes. */
  triggerElement?: HTMLElement | null;
}

interface DialogWithTitle extends DialogBaseProps {
  /** Plain-string title; `Dialog` renders the heading and wires `aria-labelledby`. */
  title: string;
  labelledBy?: never;
}

interface DialogWithLabelledBy extends DialogBaseProps {
  /** Id of caller-owned title markup in `children`. */
  labelledBy: string;
  title?: never;
}

type DialogProps = DialogWithTitle | DialogWithLabelledBy;

function useBodyScrollLock(locked: boolean): void {
  useEffect(() => {
    if (!locked) return;

    if (lockCount === 0) {
      previousOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
    }
    lockCount += 1;

    return () => {
      lockCount -= 1;
      if (lockCount === 0) {
        document.body.style.overflow = previousOverflow;
        previousOverflow = '';
      }
    };
  }, [locked]);
}

export function Dialog(props: DialogProps) {
  const {
    open,
    onClose,
    children,
    showCloseX = true,
    closeLabel = 'Close',
    closeOnBackdrop = true,
    className,
    triggerElement,
  } = props;
  const dialogRef = useRef<HTMLDialogElement>(null);
  const triggerRef = useRef<HTMLElement | null>(null);
  const titleId = useId();
  const hasTitle = props.title !== undefined;
  const labelledBy = hasTitle ? titleId : props.labelledBy;

  if (triggerElement) {
    triggerRef.current = triggerElement;
  }

  useBodyScrollLock(open);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog || typeof dialog.showModal !== 'function') return;

    if (open && !dialog.open) {
      dialog.showModal();
      dialog.querySelector<HTMLElement>(FOCUSABLE_SELECTOR)?.focus();
    }
    if (!open && dialog.open) dialog.close();
  }, [open]);

  useEffect(() => {
    if (open || !triggerRef.current) return;
    triggerRef.current.focus();
    triggerRef.current = null;
  }, [open]);

  function handleKeyDown(event: KeyboardEvent<HTMLDialogElement>) {
    if (event.key !== 'Tab') return;
    const dialog = dialogRef.current;
    if (!dialog) return;

    const focusable = Array.from(dialog.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR));
    if (focusable.length === 0) return;

    event.preventDefault();

    const currentIndex = focusable.indexOf(document.activeElement as HTMLElement);
    const lastIndex = focusable.length - 1;
    const nextIndex = event.shiftKey
      ? currentIndex <= 0
        ? lastIndex
        : currentIndex - 1
      : currentIndex === -1 || currentIndex === lastIndex
        ? 0
        : currentIndex + 1;

    focusable[nextIndex].focus();
  }

  return (
    <dialog
      ref={dialogRef}
      className={className ? `${styles.dialog} ${className}` : styles.dialog}
      aria-labelledby={labelledBy}
      onClose={onClose}
      onKeyDown={handleKeyDown}
      onClick={
        closeOnBackdrop
          ? (event) => {
              if (event.target === dialogRef.current) dialogRef.current?.close();
            }
          : undefined
      }
    >
      {showCloseX ? (
        <button
          type="button"
          className={styles.closeX}
          aria-label={closeLabel}
          onClick={() => dialogRef.current?.close()}
        >
          ×
        </button>
      ) : null}
      <div className={styles.content}>
        {hasTitle ? (
          <h2 id={titleId} className={styles.title}>
            {props.title}
          </h2>
        ) : null}
        {children}
      </div>
    </dialog>
  );
}
