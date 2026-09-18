import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { orderedLessonIds } from '@/learn/curriculum/lessonOrder';
import { progressStore } from '@/learn/stores/progressStore';
import { useProgress } from '@/learn/hooks/useProgress';

const STORAGE_KEY = 'sudoku:learn:progress';

afterEach(() => {
  act(() => {
    localStorage.clear();
    progressStore.reset();
  });
  vi.useRealTimers();
});

describe('useProgress', () => {
  it('should start empty when storage is absent', () => {
    const { result } = renderHook(() => useProgress());

    expect(result.current.completed).toEqual([]);
    expect(result.current.lastCompletedId).toBeUndefined();
  });

  it('should read completed ids persisted in storage on mount', () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        completed: [{ id: orderedLessonIds[0], completedAt: 1000 }],
      })
    );
    progressStore.reset();

    const { result } = renderHook(() => useProgress());

    expect(result.current.completed).toEqual([orderedLessonIds[0]]);
    expect(result.current.lastCompletedId).toBe(orderedLessonIds[0]);
  });

  it('should return the most recently completed lesson by timestamp, not array position', () => {
    // Seed with an out-of-time-order array: l[1] completed last despite being first in array
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        completed: [
          { id: orderedLessonIds[1], completedAt: 2000 },
          { id: orderedLessonIds[0], completedAt: 1000 },
        ],
      })
    );
    progressStore.reset();

    const { result } = renderHook(() => useProgress());

    expect(result.current.lastCompletedId).toBe(orderedLessonIds[1]);
  });

  it('should persist a newly completed lesson across a remount', () => {
    vi.useFakeTimers();
    vi.setSystemTime(5000);

    const { result, unmount } = renderHook(() => useProgress());

    act(() => result.current.markComplete(orderedLessonIds[0]));
    expect(result.current.completed).toEqual([orderedLessonIds[0]]);

    unmount();
    const { result: remounted } = renderHook(() => useProgress());

    expect(remounted.current.completed).toEqual([orderedLessonIds[0]]);
    expect(remounted.current.lastCompletedId).toBe(orderedLessonIds[0]);
  });

  it('should stamp the current time on markComplete', () => {
    vi.useFakeTimers();
    vi.setSystemTime(42000);

    const { result } = renderHook(() => useProgress());
    act(() => result.current.markComplete(orderedLessonIds[0]));

    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}');
    expect(stored.completed[0]).toEqual({ id: orderedLessonIds[0], completedAt: 42000 });
  });

  it('should ignore a lesson already marked complete', () => {
    const { result } = renderHook(() => useProgress());

    act(() => result.current.markComplete(orderedLessonIds[0]));
    const settled = result.current.completed;

    act(() => result.current.markComplete(orderedLessonIds[0]));

    expect(result.current.completed).toBe(settled);
    expect(result.current.completed).toEqual([orderedLessonIds[0]]);
  });

  it('should fall back to empty progress when storage is malformed JSON', () => {
    localStorage.setItem(STORAGE_KEY, '{not valid json');
    progressStore.reset();

    const { result } = renderHook(() => useProgress());

    expect(result.current.completed).toEqual([]);
  });

  it('should fall back to empty progress when the stored shape is wrong', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ completed: 'nope' }));
    progressStore.reset();

    const { result } = renderHook(() => useProgress());

    expect(result.current.completed).toEqual([]);
  });

  it('should update all consumers when one marks a lesson complete', () => {
    const { result: consumer1 } = renderHook(() => useProgress());
    const { result: consumer2 } = renderHook(() => useProgress());

    expect(consumer1.current.completed).toEqual([]);
    expect(consumer2.current.completed).toEqual([]);

    act(() => consumer1.current.markComplete(orderedLessonIds[0]));

    expect(consumer1.current.completed).toEqual([orderedLessonIds[0]]);
    expect(consumer2.current.completed).toEqual([orderedLessonIds[0]]);
  });
});
