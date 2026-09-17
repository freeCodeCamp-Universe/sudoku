import { useEffect, useId, useRef, type KeyboardEvent, type ReactNode } from 'react';
import styles from './Dialog.module.css';

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(', ');

interface DialogBaseProps {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  /** Show the top-corner `×` button. Defaults to `true`. */
  showCloseX?: boolean;
  /** Dismiss when the backdrop (the dialog's own padding area) is clicked. Defaults to `true`. */
  closeOnBackdrop?: boolean;
  /** Per-dialog width / content overrides, merged onto the shared `.dialog` class. */
  className?: string;
}

interface DialogWithTitle extends DialogBaseProps {
  /** Plain-string title; `Dialog` renders the `<h2>` and wires `aria-labelledby`. */
  title: string;
  labelledBy?: never;
}

interface DialogWithLabelledBy extends DialogBaseProps {
  /** Id of caller-owned title markup in `children` (for titles that can't be a plain string). */
  labelledBy: string;
  title?: never;
}

// `title` and `labelledBy` are mutually exclusive and exactly one is required.
type DialogProps = DialogWithTitle | DialogWithLabelledBy;

/**
 * Shared modal dialog built on the native `<dialog>` element.
 *
 * Modal behavior (top layer, backdrop, focus trap, Escape-to-close) is only
 * reachable through the imperative `showModal()` method, so the sync effect
 * owns the one unavoidable piece of glue. The single close contract: **only the
 * native `close` event calls `props.onClose`.** The affordances this component
 * owns (`×`, backdrop) call `dialog.close()` directly, never `onClose`; footer
 * buttons in `children` close by flipping the parent's `open` state, which
 * routes through the effect → `close()` → native `close` event → `onClose`.
 */
export function Dialog(props: DialogProps) {
  const { open, onClose, children, showCloseX = true, closeOnBackdrop = true, className } = props;
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const hasTitle = props.title !== undefined;
  const labelledBy = hasTitle ? titleId : props.labelledBy;

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog || typeof dialog.showModal !== 'function') return;
    // Handles both directions, including `open` starting true on mount. The
    // `close()` call fires the native `close` event — the single place
    // `onClose` runs. No cleanup: unmounting while open must not fire `onClose`.
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  // Native `showModal()` focus trapping is not reliable enough to lean on:
  // Chromium cycles past the last/first focusable descendant via `<body>`
  // for one keypress before wrapping (reads as a dead keystroke), and WebKit
  // is worse -- Tab from the close button never reaches the interior buttons
  // at all, oscillating between `<body>` and the `<dialog>` element itself
  // (confirmed directly; "Start New Game"/"Keep Playing" were unreachable by
  // keyboard). So every Tab press inside an open dialog is handled entirely
  // by hand: find the focused element's position in our own focusable list
  // (falling back to "nothing found" when the browser's own focus landed
  // somewhere odd) and move to the next/previous one, wrapping at the ends.
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
          aria-label="Close"
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
