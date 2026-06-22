import { renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import type { Variant } from '@/engine/types';
import { useResponsiveCellSize } from './useResponsiveCellSize';

const originalWidth = window.innerWidth;

function setViewport(width: number): void {
  Object.defineProperty(window, 'innerWidth', {
    configurable: true,
    writable: true,
    value: width,
  });
}

const classic = {
  layout: { kind: 'grid', size: 9, box: { rows: 3, cols: 3 } },
} as Variant;

const super16 = {
  layout: { kind: 'grid', size: 16, box: { rows: 4, cols: 4 } },
} as Variant;

function cellAt(width: number, variant: Variant): number {
  setViewport(width);
  const { result } = renderHook(() => useResponsiveCellSize(variant));
  return result.current;
}

describe('useResponsiveCellSize', () => {
  afterEach(() => {
    setViewport(originalWidth);
  });

  describe('classic 9×9 grid', () => {
    const cases: { width: number; cell: number }[] = [
      { width: 319, cell: 34 },
      { width: 320, cell: 34 },
      { width: 359, cell: 34 },
      { width: 360, cell: 38 },
      { width: 413, cell: 38 },
      { width: 414, cell: 44 },
      { width: 519, cell: 44 },
      { width: 520, cell: 52 },
    ];

    it.each(cases)('should return $cell px at $width px', ({ width, cell }) => {
      expect(cellAt(width, classic)).toBe(cell);
    });

    it.each(cases)('should keep the board within $width px', ({ width }) => {
      const boardWidth = 9 * cellAt(width, classic) + 6;
      expect(boardWidth).toBeLessThanOrEqual(width);
    });
  });

  describe('16×16 grid (unchanged ratio behavior)', () => {
    it('should not use the classic step table at the 320px baseline', () => {
      expect(cellAt(320, super16)).toBe(22);
    });

    it('should use the full base size on wide viewports', () => {
      expect(cellAt(800, super16)).toBe(30);
    });
  });
});
