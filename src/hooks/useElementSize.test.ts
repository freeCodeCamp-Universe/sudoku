import { renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useElementSize } from './useElementSize';

describe('useElementSize', () => {
  it('should report the element box size after mount', () => {
    const el = document.createElement('div');
    vi.spyOn(el, 'getBoundingClientRect').mockReturnValue({
      width: 360,
      height: 480,
      top: 0,
      left: 0,
      right: 360,
      bottom: 480,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    } as DOMRect);
    const ref = { current: el };

    const { result } = renderHook(() => useElementSize(ref));

    expect(result.current).toEqual({ w: 360, h: 480 });
  });

  it('should report zero before an element is attached', () => {
    const ref = { current: null };
    const { result } = renderHook(() => useElementSize(ref));
    expect(result.current).toEqual({ w: 0, h: 0 });
  });
});
