import { useEffect } from 'react';
import { useShortcutsPreference } from '@/learn/hooks/useShortcutsPreference';
import { usePlatformModifier } from '@/learn/hooks/usePlatformModifier';
import { Button } from '@/learn/base/Button/Button';
import styles from '@/learn/features/PrimaryAction/PrimaryAction.module.css';

export interface PrimaryActionProps {
  /** True once every checklist item is complete. */
  complete: boolean;
  /** The final lesson of the course; a completed capstone finishes instead of advancing. */
  isCapstone?: boolean;
  /** Advance to the next lesson, or return to Home on the completed capstone. */
  onAdvance: () => void;
  /** Report the attempt when the lesson is not finished; no navigation happens. */
  onBlocked?: () => void;
}

/**
 * The single primary control for a completed lesson, bound to the platform's
 * modifier key plus Enter. An unfinished lesson has no visible advance control,
 * but its shortcut still reports the blocked attempt so the workspace can explain
 * what is still missing.
 */
export function PrimaryAction({ complete, isCapstone = false, onAdvance, onBlocked }: PrimaryActionProps) {
  const { shortcutsEnabled } = useShortcutsPreference();
  const modifier = usePlatformModifier();
  const label = isCapstone ? 'Finish' : 'Next';

  useEffect(() => {
    if (!shortcutsEnabled) {
      return;
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== 'Enter' || !(event.metaKey || event.ctrlKey)) {
        return;
      }
      event.preventDefault();
      if (complete) {
        onAdvance();
      } else {
        onBlocked?.();
      }
    }

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [shortcutsEnabled, complete, onAdvance, onBlocked]);

  if (!complete) {
    return null;
  }

  return (
    <Button type="button" variant="cta" onClick={onAdvance} aria-keyshortcuts="Meta+Enter Control+Enter">
      {label}{' '}
      <span className={styles.hint} aria-hidden="true">
        ({modifier} + Enter)
      </span>
    </Button>
  );
}
