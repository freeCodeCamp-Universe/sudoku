import { useEffect } from 'react';
import type { InteractivePanelProps } from '@/learn/LessonWorkspace/LessonWorkspace';
import styles from '@/learn/PlaceholderPanel/PlaceholderPanel.module.css';

/**
 * Stub interactive panel. Renders a styled placeholder and immediately reports
 * the lesson complete so the lesson flow works out of the box.
 *
 * Replace this component with your own when building a real course.
 * See architecture.md → "Replacing the placeholder panel".
 */
export function PlaceholderPanel({ onUpdate }: InteractivePanelProps) {
  useEffect(() => {
    onUpdate({ complete: true });
  }, [onUpdate]);

  return (
    <div className={styles.placeholder}>
      <p className={styles.label}>Interactive panel — replace this component with your content.</p>
      <p className={styles.hint}>
        See <code>architecture.md</code> for step-by-step instructions.
      </p>
    </div>
  );
}
