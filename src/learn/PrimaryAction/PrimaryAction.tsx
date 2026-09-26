import { useEffect } from 'react';
import { useShortcutsPreference } from '@/learn/hooks/useShortcutsPreference';
import { usePlatformModifier } from '@/hooks/usePlatformModifier';
import { Button } from '@/components/Button';
import styles from '@/learn/PrimaryAction/PrimaryAction.module.css';

export interface PrimaryActionProps {
  /** True once every checklist item is complete. */
  complete: boolean;
  /** The final lesson of the course; a completed capstone finishes instead of advancing. */
  isCapstone?: boolean;
  /** Advance to the next lesson, or return to Home on the completed capstone. */
  onAdvance: () => void;
}

/**
 * The single primary control for a completed lesson, bound to the platform's
 * modifier key plus Enter. An unfinished lesson has no advance control, and the
 * shortcut only works while the control is on screen.
 */
export function PrimaryAction({ complete, isCapstone = false, onAdvance }: PrimaryActionProps) {
  const { shortcutsEnabled } = useShortcutsPreference();
  const modifier = usePlatformModifier();
  const label = isCapstone ? 'Finish' : 'Next';

  useEffect(() => {
    if (!shortcutsEnabled || !complete) {
      return;
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== 'Enter' || !(event.metaKey || event.ctrlKey)) {
        return;
      }
      event.preventDefault();
      onAdvance();
    }

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [shortcutsEnabled, complete, onAdvance]);

  if (!complete) {
    return null;
  }

  return (
    <Button
      type="button"
      variant="cta"
      onClick={onAdvance}
      aria-keyshortcuts="Meta+Enter Control+Enter"
    >
      {label}{' '}
      <span className={styles.hint} aria-hidden="true">
        ({modifier} + Enter)
      </span>
    </Button>
  );
}
