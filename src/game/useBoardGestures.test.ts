import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useBoardGestures } from './useBoardGestures';

function pointerEvent(overrides: Partial<{ pointerId: number; clientX: number; clientY: number }>) {
  return {
    pointerId: 1,
    clientX: 0,
    clientY: 0,
    currentTarget: { setPointerCapture: vi.fn(), releasePointerCapture: vi.fn() },
    ...overrides,
  } as unknown as React.PointerEvent;
}

describe('useBoardGestures', () => {
  it('should pan by the pointer delta while dragging', () => {
    const panBy = vi.fn();
    const viewport = {
      panBy,
      zoomBy: vi.fn(),
      transform: { scale: 1, translateX: 0, translateY: 0 },
    } as unknown as ReturnType<typeof Object>;

    const { result } = renderHook(() => useBoardGestures(viewport as never));

    act(() => result.current.onPointerDown(pointerEvent({ clientX: 100, clientY: 100 })));
    act(() => result.current.onPointerMove(pointerEvent({ clientX: 130, clientY: 90 })));

    expect(panBy).toHaveBeenCalledWith(30, -10);
  });

  it('should not pan after the pointer is released', () => {
    const panBy = vi.fn();
    const viewport = { panBy, zoomBy: vi.fn() } as unknown as never;
    const { result } = renderHook(() => useBoardGestures(viewport));

    act(() => result.current.onPointerDown(pointerEvent({ clientX: 0, clientY: 0 })));
    act(() => result.current.onPointerUp(pointerEvent({})));
    act(() => result.current.onPointerMove(pointerEvent({ clientX: 50, clientY: 50 })));

    expect(panBy).not.toHaveBeenCalled();
  });
});
