import { useEffect, useId, useRef, type ReactNode } from 'react';
import styles from './Dialog.module.css';

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

  return (
    <dialog
      ref={dialogRef}
      className={className ? `${styles.dialog} ${className}` : styles.dialog}
      aria-labelledby={labelledBy}
      onClose={onClose}
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
