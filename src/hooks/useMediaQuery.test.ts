import { renderHook, act } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useMediaQuery } from './useMediaQuery';

const QUERY = '(min-width: 1024px)';
const defaultMatchMedia = window.matchMedia;

function mockMatchMedia(matches: boolean) {
  let changeListener: (() => void) | undefined;
  const mediaQueryList = {
    matches,
    addEventListener: vi.fn((_type: string, listener: () => void) => {
      changeListener = listener;
    }),
    removeEventListener: vi.fn(),
  };

  vi.spyOn(window, 'matchMedia').mockReturnValue(mediaQueryList as unknown as MediaQueryList);

  return {
    mediaQueryList,
    setMatches(nextMatches: boolean) {
      mediaQueryList.matches = nextMatches;
      act(() => changeListener?.());
    },
  };
}

afterEach(() => {
  vi.restoreAllMocks();
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    writable: true,
    value: defaultMatchMedia,
  });
});

describe('useMediaQuery', () => {
  it('should return the current match on the first render', () => {
    mockMatchMedia(true);
    const { result } = renderHook(() => useMediaQuery(QUERY));

    expect(result.current).toBe(true);
  });

  it('should update when the media query starts or stops matching', () => {
    const mediaQuery = mockMatchMedia(false);
    const { result } = renderHook(() => useMediaQuery(QUERY));

    expect(result.current).toBe(false);

    mediaQuery.setMatches(true);
    expect(result.current).toBe(true);

    mediaQuery.setMatches(false);
    expect(result.current).toBe(false);
  });

  it('should return false when matchMedia is unavailable', () => {
    Object.defineProperty(window, 'matchMedia', {
      configurable: true,
      value: undefined,
    });

    const { result } = renderHook(() => useMediaQuery(QUERY));

    expect(result.current).toBe(false);
  });

  it('should remove its listener on unmount', () => {
    const mediaQuery = mockMatchMedia(true);
    const { unmount } = renderHook(() => useMediaQuery(QUERY));

    unmount();

    const listener = mediaQuery.mediaQueryList.addEventListener.mock.calls[0][1];
    expect(mediaQuery.mediaQueryList.removeEventListener).toHaveBeenCalledWith('change', listener);
  });
});
