import { renderHook, act } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { usePersistence } from './usePersistence';

describe('usePersistence', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('should default checkEnabled to true', () => {
    const { result } = renderHook(() => usePersistence('classic'));

    expect(result.current.settings.checkEnabled).toBe(true);
  });

  it('should default timerEnabled to true', () => {
    const { result } = renderHook(() => usePersistence('classic'));

    expect(result.current.settings.timerEnabled).toBe(true);
  });

  it('should persist checkEnabled toggle to localStorage', () => {
    const { result } = renderHook(() => usePersistence('classic'));

    act(() => {
      result.current.toggleCheck();
    });

    expect(localStorage.getItem('sudoku-check-answers')).toBe('false');
  });

  it('should persist timerEnabled toggle to localStorage', () => {
    const { result } = renderHook(() => usePersistence('classic'));

    act(() => {
      result.current.toggleTimer();
    });

    expect(localStorage.getItem('sudoku-timer')).toBe('false');
  });

  it('should read previously stored settings on mount', () => {
    localStorage.setItem('sudoku-check-answers', 'false');
    localStorage.setItem('sudoku-timer', 'false');

    const { result } = renderHook(() => usePersistence('classic'));

    expect(result.current.settings.checkEnabled).toBe(false);
    expect(result.current.settings.timerEnabled).toBe(false);
  });
});
