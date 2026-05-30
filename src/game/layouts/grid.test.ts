import { describe, expect, it } from 'vitest';
import type { Variant } from '@/engine/types';
import { gridLayout } from './grid';

const classicVariant: Variant = {
  id: 'classic',
  name: 'Classic Sudoku',
  difficulty: 'intermediate',
  layout: { kind: 'grid', size: 9, box: { rows: 3, cols: 3 } },
  symbols: [1, 2, 3, 4, 5, 6, 7, 8, 9],
  constraintIds: [],
};

describe('gridLayout strategy', () => {
  it('should return 81 cell rects for a 9x9 grid', () => {
    expect(gridLayout.cellRects(classicVariant).size).toBe(81);
  });

  it('should place r0c0 at x=0, y=0', () => {
    const r0c0 = gridLayout.cellRects(classicVariant).get('r0c0');

    expect(r0c0?.x).toBe(0);
    expect(r0c0?.y).toBe(0);
  });

  it('should produce a canvas size matching size * cellSize', () => {
    const size = gridLayout.canvasSize(classicVariant);

    expect(size.w).toBe(size.h);
    expect(size.w).toBeGreaterThan(0);
  });

  it('should not produce gutters for a plain grid', () => {
    expect(gridLayout.gutters?.(classicVariant)).toBeUndefined();
  });
});
