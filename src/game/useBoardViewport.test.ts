import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { useBoardViewport } from './useBoardViewport';
import { fitScale } from './boardViewport';

const board = { w: 840, h: 840 };
const viewport = { w: 360, h: 360 };

// Bring an oversized board from the initial fitted view to natural size so
// pan-oriented tests have room to move.
function zoomToNaturalSize(result: { current: ReturnType<typeof useBoardViewport> }) {
  act(() => result.current.zoomBy(1 / fitScale(board, viewport)));
}

describe('useBoardViewport', () => {
  it('should start with the whole oversized board fitted into the viewport', () => {
    const { result } = renderHook(() => useBoardViewport(board, viewport));
    expect(result.current.transform.scale).toBeCloseTo(fitScale(board, viewport));
    expect(result.current.transform.translateX).toBeCloseTo(0);
    expect(result.current.transform.translateY).toBeCloseTo(0);
  });

  it('should start a fitting board at natural size, centered', () => {
    const { result } = renderHook(() => useBoardViewport({ w: 300, h: 300 }, viewport));
    expect(result.current.transform.scale).toBe(1);
    expect(result.current.transform.translateX).toBe(30);
    expect(result.current.transform.translateY).toBe(30);
  });

  it('should start at the origin while the viewport is unmeasured', () => {
    const { result } = renderHook(() => useBoardViewport(board, { w: 0, h: 0 }));
    expect(result.current.transform).toEqual({ scale: 1, translateX: 0, translateY: 0 });
  });

  it('should clamp a pan so the board cannot leave the viewport', () => {
    const { result } = renderHook(() => useBoardViewport(board, viewport));
    zoomToNaturalSize(result);
    act(() => result.current.panBy(500, 0)); // try to drag right past the edge
    expect(result.current.transform.translateX).toBe(0);
  });

  it('should pan within bounds', () => {
    const { result } = renderHook(() => useBoardViewport(board, viewport));
    zoomToNaturalSize(result);
    // Zooming about the viewport center leaves the board at -240; pan from there.
    act(() => result.current.panBy(-100, 0));
    expect(result.current.transform.translateX).toBe(-340);
  });

  it('should center the given board point when zooming on it', () => {
    const { result } = renderHook(() => useBoardViewport(board, viewport));
    act(() => result.current.zoomOnPoint(1 / fitScale(board, viewport), { x: 420, y: 420 }));
    expect(result.current.transform.scale).toBeCloseTo(1);
    expect(result.current.transform.translateX).toBeCloseTo(180 - 420);
    expect(result.current.transform.translateY).toBeCloseTo(180 - 420);
  });

  it('should clamp the centered point at a board edge when zooming on it', () => {
    const { result } = renderHook(() => useBoardViewport(board, viewport));
    act(() => result.current.zoomOnPoint(1 / fitScale(board, viewport), { x: 20, y: 20 }));
    expect(result.current.transform.translateX).toBe(0);
    expect(result.current.transform.translateY).toBe(0);
  });

  it('should animate programmatic moves but not gestures', () => {
    const { result } = renderHook(() => useBoardViewport(board, viewport));
    expect(result.current.animated).toBe(false);
    act(() => result.current.zoomOnPoint(2, { x: 420, y: 420 }));
    expect(result.current.animated).toBe(true);
    act(() => result.current.panBy(-10, 0));
    expect(result.current.animated).toBe(false);
    act(() => result.current.ensureVisible({ x: 800, y: 0, w: 40, h: 40 }));
    expect(result.current.animated).toBe(true);
    act(() => result.current.zoomBy(1.1, { x: 10, y: 10 }));
    expect(result.current.animated).toBe(false);
  });

  it('should return to the fitted view on fitWhole', () => {
    const { result } = renderHook(() => useBoardViewport(board, viewport));
    zoomToNaturalSize(result);
    act(() => result.current.panBy(-100, -100));
    act(() => result.current.fitWhole());
    expect(result.current.transform.scale).toBeCloseTo(fitScale(board, viewport));
    expect(result.current.transform.translateX).toBeCloseTo(0);
    expect(result.current.transform.translateY).toBeCloseTo(0);
  });

  it('should center on a tapped minimap point', () => {
    const { result } = renderHook(() => useBoardViewport(board, viewport));
    zoomToNaturalSize(result);
    act(() => result.current.panToMinimapPoint({ x: 75, y: 75 }, { w: 150, h: 150 }));
    expect(result.current.transform.translateX).toBeCloseTo(180 - 420);
  });

  it('should pan an off-screen cell into view', () => {
    const { result } = renderHook(() => useBoardViewport(board, viewport));
    zoomToNaturalSize(result);
    act(() => result.current.ensureVisible({ x: 800, y: 0, w: 40, h: 40 }));
    const right = result.current.transform.translateX + 840 * result.current.transform.scale;
    expect(right).toBeGreaterThanOrEqual(viewport.w);
    expect(result.current.transform.translateX).toBeLessThan(0);
  });
});
