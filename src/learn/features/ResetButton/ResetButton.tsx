import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/Button';
import { Drawer } from '@/learn/base/Drawer/Drawer';
import { useMediaQuery } from '@/learn/hooks/useMediaQuery';
import styles from '@/learn/features/ResetButton/ResetButton.module.css';

export interface ResetButtonProps {
  /** Restore the pristine buffer, virtual directory, and checklist. */
  onReset: () => void;
}

/**
 * Narrow touch phones only — excludes tablets (≥768px) and pointer devices.
 * On these devices the confirm UI is a bottom Drawer rather than an inline
 * expand, which is easier to reach and dismiss.
 */
const MOBILE_MQ = '(max-width: 767px) and (hover: none)';

/**
 * The secondary Reset control. Because a reset is destructive, it has no keyboard
 * shortcut and is driven only by clicking. A first click opens a lightweight
 * confirm so an accidental press cannot discard work; confirming resets,
 * cancelling dismisses.
 *
 * On touch phones the confirm is presented in a bottom Drawer.
 * On all other viewports it replaces the Reset button inline.
 */
export function ResetButton({ onReset }: ResetButtonProps) {
  const [confirming, setConfirming] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const isMobile = useMediaQuery(MOBILE_MQ);
  const resetRef = useRef<HTMLButtonElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);
  const restoreFocus = useRef(false);

  // Keep focus on the safer cancellation path when the Reset button is replaced,
  // and restore it to Reset when cancellation remounts that button.
  useEffect(() => {
    if (confirming) {
      cancelRef.current?.focus();
    } else if (restoreFocus.current) {
      restoreFocus.current = false;
      resetRef.current?.focus();
    }
  }, [confirming]);

  if (!isMobile && confirming) {
    return (
      <div className={styles.confirm} role="group" aria-label="confirm reset">
        <span className={styles.prompt}>Reset this lesson?</span>
        <Button
          type="button"
          ref={cancelRef}
          onClick={() => {
            restoreFocus.current = true;
            setConfirming(false);
          }}
        >
          Cancel
        </Button>
        <Button
          type="button"
          hoverColor="red"
          onClick={() => {
            setConfirming(false);
            onReset();
          }}
        >
          Yes, reset
        </Button>
      </div>
    );
  }

  return (
    <>
      <Button
        ref={resetRef}
        type="button"
        hoverColor="red"
        className={styles.reset}
        onClick={() => (isMobile ? setDrawerOpen(true) : setConfirming(true))}
      >
        Reset
      </Button>

      {isMobile && (
        <Drawer
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          slideFrom="bottom"
          title="Confirm reset"
          triggerElement={resetRef.current}
          initialFocus={cancelRef}
        >
          <Drawer.Body>
            <p className={styles['drawer-prompt']}>Reset your edits and progress in this lesson?</p>
          </Drawer.Body>
          <Drawer.Footer>
            <div className={styles['drawer-actions']}>
              <Button type="button" ref={cancelRef} onClick={() => setDrawerOpen(false)}>
                Cancel
              </Button>
              <Button
                type="button"
                hoverColor="red"
                onClick={() => {
                  setDrawerOpen(false);
                  onReset();
                }}
              >
                Yes, reset
              </Button>
            </div>
          </Drawer.Footer>
        </Drawer>
      )}
    </>
  );
}
