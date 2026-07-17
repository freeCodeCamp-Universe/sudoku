import type { ReactNode } from 'react';
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import styles from './ToastStack.module.css';

const TOAST_DURATION_MS = 6000;
// Mirrors the exit transition duration in ToastStack.module.css.
const TOAST_EXIT_MS = 200;

export interface ToastItem {
  /** Unique per push; a replaced toast must get a fresh id to restart it. */
  id: number;
  /** Plain-text form of the toast, spoken by the live region. */
  message: string;
  /** Visible rich content; falls back to `message` when omitted. */
  content?: ReactNode;
}

interface ToastStackProps {
  toasts: ToastItem[];
  /** Called once a toast's exit transition finishes; remove it from the list. */
  onDismiss: (id: number) => void;
  durationMs?: number;
  exitMs?: number;
}

interface ToastProps {
  toast: ToastItem;
  onDismiss: (id: number) => void;
  durationMs: number;
  exitMs: number;
}

// Each toast owns its auto-dismiss countdown; hovering or focusing it pauses
// the countdown (WCAG 2.2.1: give readers time) and leaving restarts the full
// duration. The visible copy is aria-hidden because the stack's live region
// already speaks it, so it would otherwise be read twice.
function Toast({ toast, onDismiss, durationMs, exitMs }: ToastProps) {
  const [closing, setClosing] = useState(false);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused || closing) {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      setClosing(true);
    }, durationMs);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [paused, closing, durationMs]);

  // Stay mounted through the exit transition, then hand removal to the owner.
  useEffect(() => {
    if (!closing) {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      onDismiss(toast.id);
    }, exitMs);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [closing, exitMs, onDismiss, toast.id]);

  return (
    <div
      className={styles.toast}
      data-closing={closing || undefined}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <span aria-hidden="true">{toast.content ?? toast.message}</span>
      <button type="button" className={styles.dismiss} onClick={() => setClosing(true)}>
        Dismiss
      </button>
    </div>
  );
}

// Portaled to <body>: the stack is fixed-positioned, and rendering it inside
// the game layout would let a transformed ancestor (the pan/zoom clip) become
// its containing block and anchor it to the board instead of the viewport.
// The status region stays mounted permanently and only its text changes:
// screen readers skip live regions that enter the DOM with content already in
// them, so mounting the region together with a toast would not announce.
export function ToastStack({
  toasts,
  onDismiss,
  durationMs = TOAST_DURATION_MS,
  exitMs = TOAST_EXIT_MS,
}: ToastStackProps) {
  const [announced, setAnnounced] = useState('');
  const seenIdsRef = useRef(new Set<number>());

  // Announce each toast once, when it is first pushed; dismissing a newer
  // toast must not re-announce the older ones still on screen. A re-pushed
  // toast with unchanged text stays silent (the region's text does not
  // change), matching how the numpad's persistent labels carry ongoing state.
  useEffect(() => {
    const fresh = toasts.filter((toast) => !seenIdsRef.current.has(toast.id));

    for (const toast of fresh) {
      seenIdsRef.current.add(toast.id);
    }

    if (fresh.length > 0) {
      setAnnounced(fresh[fresh.length - 1].message);
    } else if (toasts.length === 0) {
      setAnnounced('');
    }
  }, [toasts]);

  return createPortal(
    <>
      <span role="status" className={styles.srOnly}>
        {announced}
      </span>
      {toasts.length > 0 ? (
        <div className={styles.stack}>
          {/* Newest first: a fresh toast appears at the top and pushes older
              ones down. Reversing the array rather than using column-reverse
              keeps DOM and tab order matching the visual order. */}
          {[...toasts].reverse().map((toast) => (
            <Toast
              key={toast.id}
              toast={toast}
              onDismiss={onDismiss}
              durationMs={durationMs}
              exitMs={exitMs}
            />
          ))}
        </div>
      ) : null}
    </>,
    document.body
  );
}
