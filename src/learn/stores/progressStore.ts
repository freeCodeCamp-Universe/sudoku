import { type CompletedEntry, readProgress, writeProgress } from '@/learn/hooks/progressStorage';

let entries: CompletedEntry[] = readProgress();
const listeners = new Set<() => void>();

function notify(): void {
  for (const listener of listeners) {
    listener();
  }
}

export const progressStore = {
  getEntries: (): CompletedEntry[] => entries,

  subscribe: (listener: () => void): (() => void) => {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },

  /**
   * Mark a lesson complete and persist it. Re-reads storage before writing so a
   * completion appends to whatever another tab may have written since mount.
   * No-op if the lesson is already complete.
   */
  markComplete: (lessonId: string): void => {
    const current = readProgress();
    if (current.some((e) => e.id === lessonId)) {
      return;
    }
    const next = [...current, { id: lessonId, completedAt: Date.now() }];
    writeProgress(next);
    entries = next;
    notify();
  },

  /** Test-only: re-read storage and notify subscribers. */
  reset: (): void => {
    entries = readProgress();
    notify();
  },
};
