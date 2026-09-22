import { useEffect } from 'react';
import { initChecklist } from '@/learn/curriculum/lessonProgress';
import type { InteractivePanelProps } from '@/learn/LessonWorkspace/LessonWorkspace';
import styles from '@/learn/PlaceholderPanel/PlaceholderPanel.module.css';

/**
 * Stub interactive panel. Renders a styled placeholder and immediately marks
 * all checklist items as complete so the lesson flow works out of the box.
 *
 * Replace this component with your own when building a real course.
 * See architecture.md → "Replacing the placeholder panel".
 */
export function PlaceholderPanel({ lesson, onUpdate, onReset: _onReset }: InteractivePanelProps) {
  useEffect(() => {
    const checklist = initChecklist(lesson.config.checklist).map((item) => ({
      ...item,
      status: 'completed' as const,
    }));
    onUpdate({ checklist, complete: true });
  }, [lesson, onUpdate]);

  return (
    <div className={styles.placeholder}>
      <p className={styles.label}>Interactive panel — replace this component with your content.</p>
      <p className={styles.hint}>
        See <code>architecture.md</code> for step-by-step instructions.
      </p>
    </div>
  );
}
