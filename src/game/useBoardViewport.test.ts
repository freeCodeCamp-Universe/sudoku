import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { useBoardViewport } from './useBoardViewport';
import { fitScale } from './boardViewport';

const board = { w: 840, h: 840 };
const viewport = { w: 360, h: 360 };

describe('useBoardViewport', () => {
  it('should start at scale 1 pinned to the top-left', () => {
    const { result } = renderHook(() => useBoardViewport(board, viewport));
    expect(result.current.transform.scale).toBe(1);
    expect(result.current.transform.translateX).toBe(0);
    expect(result.current.transform.translateY).toBe(0);
  });

  it('should clamp a pan so the board cannot leave the viewport', () => {
    const { result } = renderHook(() => useBoardViewport(board, viewport));
    act(() => result.current.panBy(500, 0)); // try to drag right past the edge
    expect(result.current.transform.translateX).toBe(0);
  });

  it('should pan within bounds', () => {
    const { result } = renderHook(() => useBoardViewport(board, viewport));
    act(() => result.current.panBy(-100, 0));
    expect(result.current.transform.translateX).toBe(-100);
  });

  it('should zoom out to the fit scale on fitWhole', () => {
    const { result } = renderHook(() => useBoardViewport(board, viewport));
    act(() => result.current.fitWhole());
    expect(result.current.transform.scale).toBeCloseTo(fitScale(board, viewport));
  });

  it('should center on a tapped minimap point', () => {
    const { result } = renderHook(() => useBoardViewport(board, viewport));
    act(() => result.current.panToMinimapPoint({ x: 75, y: 75 }, { w: 150, h: 150 }));
    expect(result.current.transform.translateX).toBeCloseTo(180 - 420);
  });

  it('should pan an off-screen cell into view', () => {
    const { result } = renderHook(() => useBoardViewport(board, viewport));
    act(() => result.current.ensureVisible({ x: 800, y: 0, w: 40, h: 40 }));
    const right = result.current.transform.translateX + 840 * result.current.transform.scale;
    expect(right).toBeGreaterThanOrEqual(viewport.w);
  });
});
