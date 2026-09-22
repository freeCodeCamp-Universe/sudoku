import { useCallback, useState } from 'react';
import {
  isProseLesson,
  type ClientLessonDefinition,
  type ClientInteractiveLessonDefinition,
} from '@/curriculum/types';
import { initChecklist, type ChecklistItem } from '@/curriculum/lessonProgress';

export interface LessonSnapshot {
  checklist: readonly ChecklistItem[];
  complete: boolean;
}

export interface UseLessonResult {
  checklist: readonly ChecklistItem[];
  complete: boolean;
  feedback: string | null;
  onUpdate: (snapshot: LessonSnapshot) => void;
  reset: () => void;
  reportIncomplete: () => void;
}

function seedSnapshot(lesson: ClientLessonDefinition): LessonSnapshot {
  if (isProseLesson(lesson)) {
    return { checklist: [], complete: true };
  }
  const interactive = lesson as ClientInteractiveLessonDefinition;
  const checklist = initChecklist(interactive.config.checklist);
  return { checklist, complete: checklist.length === 0 };
}

/**
 * Manages lesson-sidebar state for the two-panel layout. The interactive panel
 * owns its engine state and calls `onUpdate` with each snapshot; this hook
 * mirrors those snapshots and owns the `feedback` string shown below the checklist.
 */
export function useLesson(lesson: ClientLessonDefinition): UseLessonResult {
  const [snapshot, setSnapshot] = useState<LessonSnapshot>(() => seedSnapshot(lesson));
  const [feedback, setFeedback] = useState<string | null>(null);

  const onUpdate = useCallback((snap: LessonSnapshot) => {
    setSnapshot(snap);
    setFeedback(null);
  }, []);

  const reset = useCallback(() => {
    setSnapshot(seedSnapshot(lesson));
    setFeedback(null);
  }, [lesson]);

  const reportIncomplete = useCallback(() => {
    setFeedback('Complete all checklist items before continuing.');
    setSnapshot((prev) => ({
      ...prev,
      checklist: prev.checklist.map((item) =>
        item.status === 'completed'
          ? item
          : { ...item, status: 'error' as const, showHint: item.hint !== undefined }
      ),
    }));
  }, []);

  return {
    checklist: snapshot.checklist,
    complete: snapshot.complete,
    feedback,
    onUpdate,
    reset,
    reportIncomplete,
  };
}
