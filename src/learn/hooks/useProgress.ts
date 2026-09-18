import { useMemo, useSyncExternalStore } from 'react';
import { progressStore } from '@/learn/stores/progressStore';

export interface UseProgressResult {
  /** Completed lesson ids in the order they were persisted. */
  completed: string[];
  /** The id of the most recently completed lesson, determined by timestamp. */
  lastCompletedId: string | undefined;
  /** Mark a lesson complete and persist it; a no-op if already complete. */
  markComplete: (lessonId: string) => void;
}

/**
 * Subscribes to the shared progress store so every consumer sees the same
 * completed-lesson state and re-renders together when a lesson is marked
 * complete. Reads localStorage synchronously on first access so the overview
 * renders on first paint with no loading state.
 */
export function useProgress(): UseProgressResult {
  const entries = useSyncExternalStore(progressStore.subscribe, progressStore.getEntries, progressStore.getEntries);

  const completed = useMemo(() => entries.map((e) => e.id), [entries]);

  const lastCompletedId = useMemo(() => {
    if (entries.length === 0) {
      return undefined;
    }
    return entries.reduce((max, e) => (e.completedAt > max.completedAt ? e : max)).id;
  }, [entries]);

  return { completed, lastCompletedId, markComplete: progressStore.markComplete };
}
