import { renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { ThemeProvider } from '@/app/ThemeProvider';
import type { Variant } from '@/engine/types';
import { COMFORTABLE_CELL_SIZE } from './boardViewport';
import { boardFrameWidth } from './layouts/cellSizes';
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

const sujiken = {
  layout: { kind: 'triangular', size: 9 },
} as Variant;

const mini = {
  layout: { kind: 'grid', size: 4, box: { rows: 2, cols: 2 } },
} as Variant;

const sixBySix = {
  layout: { kind: 'grid', size: 6, box: { rows: 2, cols: 3 } },
} as Variant;

const super16 = {
  layout: { kind: 'grid', size: 16, box: { rows: 4, cols: 4 } },
} as Variant;

function cellAt(width: number, variant: Variant, { highContrast = false } = {}): number {
  localStorage.setItem('sudoku-high-contrast', String(highContrast));
  setViewport(width);
  const { result } = renderHook(() => useResponsiveCellSize(variant), {
    wrapper: ThemeProvider,
  });
  return result.current;
}

describe('useResponsiveCellSize', () => {
  afterEach(() => {
    setViewport(originalWidth);
    localStorage.clear();
    document.documentElement.classList.remove('high-contrast');
  });

  describe('9-column boards fit their viewport bucket', () => {
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

    it.each(cases)(
      'should return $cell px at $width px for the classic grid',
      ({ width, cell }) => {
        expect(cellAt(width, classic)).toBe(cell);
      }
    );

    it.each(cases)('should keep the classic board within $width px', ({ width }) => {
      const boardWidth = 9 * cellAt(width, classic) + boardFrameWidth(false);
      expect(boardWidth).toBeLessThanOrEqual(width);
    });

    it.each(cases)(
      'should return $cell px at $width px for the 9-row triangular board',
      ({ width, cell }) => {
        expect(cellAt(width, sujiken)).toBe(cell);
      }
    );
  });

  describe('small boards that already fit keep their base size', () => {
    it('should keep the 4×4 board at its base size on the smallest viewport', () => {
      expect(cellAt(320, mini)).toBe(52);
    });

    it('should keep the 6×6 board at its base size on the smallest viewport', () => {
      expect(cellAt(320, sixBySix)).toBe(52);
    });
  });

  describe('high contrast widens the frame the fit accounts for', () => {
    it('should shrink the 6×6 board on the smallest viewport when its wider frame overflows', () => {
      expect(cellAt(320, sixBySix, { highContrast: true })).toBe(44);
    });

    it('should keep the classic board within the smallest viewport', () => {
      const cell = cellAt(320, classic, { highContrast: true });
      expect(9 * cell + boardFrameWidth(true)).toBeLessThanOrEqual(320);
    });
  });

  describe('oversized boards use a fixed comfortable cell size', () => {
    const samurai = {
      layout: {
        kind: 'multigrid',
        canvasCols: 21,
        canvasRows: 21,
        subGridSize: 9,
        box: { rows: 3, cols: 3 },
        subGrids: [] as { originRow: number; originCol: number }[],
      },
    } as unknown as Variant;

    it('should render a 16×16 board at the comfortable size on mobile', () => {
      expect(cellAt(320, super16)).toBe(COMFORTABLE_CELL_SIZE);
    });

    it('should render a multigrid board at the comfortable size on mobile', () => {
      expect(cellAt(320, samurai)).toBe(COMFORTABLE_CELL_SIZE);
    });

    it('should keep the comfortable size just below the desktop cutoff', () => {
      expect(cellAt(1023, super16)).toBe(COMFORTABLE_CELL_SIZE);
    });

    it('should keep the base size on desktop', () => {
      expect(cellAt(1440, super16)).toBe(30);
      expect(cellAt(1024, samurai)).toBe(30);
    });
  });
});
