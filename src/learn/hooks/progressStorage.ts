export const PROGRESS_STORAGE_KEY = 'sudoku:learn:progress';

export interface CompletedEntry {
  id: string;
  /** Unix timestamp (ms) when the lesson was marked complete. */
  completedAt: number;
}

interface StoredProgress {
  completed: CompletedEntry[];
}

export function readProgress(): CompletedEntry[] {
  try {
    const raw = localStorage.getItem(PROGRESS_STORAGE_KEY);
    if (raw === null) {
      return [];
    }

    const parsed = JSON.parse(raw) as unknown;
    if (typeof parsed !== 'object' || parsed === null) {
      return [];
    }

    const stored = parsed as { completed?: unknown };

    if (!Array.isArray(stored.completed)) {
      return [];
    }

    return (stored.completed as unknown[]).filter(
      (entry): entry is CompletedEntry =>
        typeof entry === 'object' &&
        entry !== null &&
        typeof (entry as CompletedEntry).id === 'string' &&
        typeof (entry as CompletedEntry).completedAt === 'number'
    );
  } catch {
    return [];
  }
}

export function writeProgress(completed: CompletedEntry[]): void {
  try {
    const payload: StoredProgress = { completed };
    localStorage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // Persistence is best-effort: a full or unavailable store must not break the app.
  }
}
