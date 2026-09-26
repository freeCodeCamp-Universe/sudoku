import { useCallback, useState } from 'react';
import {
  isProseLesson,
  type ClientLessonDefinition,
  type ClientInteractiveLessonDefinition,
} from '@/curriculum/types';

export interface LessonSnapshot {
  complete: boolean;
}

export interface UseLessonResult {
  complete: boolean;
  onUpdate: (snapshot: LessonSnapshot) => void;
  reset: () => void;
}

function seedSnapshot(lesson: ClientLessonDefinition): LessonSnapshot {
  if (isProseLesson(lesson)) {
    return { complete: true };
  }
  const interactive = lesson as ClientInteractiveLessonDefinition;
  return { complete: interactive.config.checklist.length === 0 };
}

/**
 * Mirrors the completion state the interactive panel reports. The panel owns
 * its engine state and calls `onUpdate` after each graded input.
 */
export function useLesson(lesson: ClientLessonDefinition): UseLessonResult {
  const [snapshot, setSnapshot] = useState<LessonSnapshot>(() => seedSnapshot(lesson));

  const reset = useCallback(() => {
    setSnapshot(seedSnapshot(lesson));
  }, [lesson]);

  return {
    complete: snapshot.complete,
    onUpdate: setSnapshot,
    reset,
  };
}
