import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { INITIAL_FOCUS_PREFERENCE_EVENT, INITIAL_FOCUS_STORAGE_KEY, useInitialFocusPreference } from '@/learn/hooks/useInitialFocusPreference';

afterEach(() => {
  localStorage.clear();
});

describe('useInitialFocusPreference', () => {
  it('should default to focusing the terminal (false)', () => {
    const { result } = renderHook(() => useInitialFocusPreference());

    expect(result.current.focusInstructionsOnLoad).toBe(false);
    expect(localStorage.getItem(INITIAL_FOCUS_STORAGE_KEY)).toBe('false');
  });

  it('should read a stored preference to focus instructions', () => {
    localStorage.setItem(INITIAL_FOCUS_STORAGE_KEY, 'true');

    const { result } = renderHook(() => useInitialFocusPreference());

    expect(result.current.focusInstructionsOnLoad).toBe(true);
  });

  it('should persist changes and dispatch the preference event', () => {
    const listener = vi.fn();
    window.addEventListener(INITIAL_FOCUS_PREFERENCE_EVENT, listener);
    const { result } = renderHook(() => useInitialFocusPreference());
    listener.mockClear();

    act(() => result.current.setFocusInstructionsOnLoad(true));

    expect(localStorage.getItem(INITIAL_FOCUS_STORAGE_KEY)).toBe('true');
    expect(listener).toHaveBeenCalledTimes(1);

    window.removeEventListener(INITIAL_FOCUS_PREFERENCE_EVENT, listener);
  });

  it('should update when the preference event fires', () => {
    const { result } = renderHook(() => useInitialFocusPreference());

    act(() => {
      localStorage.setItem(INITIAL_FOCUS_STORAGE_KEY, 'true');
      window.dispatchEvent(new Event(INITIAL_FOCUS_PREFERENCE_EVENT));
    });

    expect(result.current.focusInstructionsOnLoad).toBe(true);
  });
});
