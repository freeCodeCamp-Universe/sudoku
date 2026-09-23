import { describe, expect, it } from 'vitest';
import type { Variant } from '@/engine/types';
import { multigridLayout } from './multigrid';

const samuraiVariant: Variant = {
  id: 'samurai',
  name: 'Samurai Sudoku',
  description: 'Test variant.',
  popularity: 0,
  difficulty: 'advanced',
  layout: {
    kind: 'multigrid',
    subGridSize: 9,
    box: { rows: 3, cols: 3 },
    canvasRows: 21,
    canvasCols: 21,
    subGrids: [
      { originRow: 0, originCol: 0 },
      { originRow: 0, originCol: 12 },
      { originRow: 6, originCol: 6 },
      { originRow: 12, originCol: 0 },
      { originRow: 12, originCol: 12 },
    ],
  },
  symbols: [1, 2, 3, 4, 5, 6, 7, 8, 9],
  constraintIds: [],
};

const butterflyVariant: Variant = {
  id: 'butterfly',
  name: 'Butterfly Sudoku',
  description: 'Test variant.',
  popularity: 0,
  difficulty: 'advanced',
  layout: {
    kind: 'multigrid',
    subGridSize: 9,
    box: { rows: 3, cols: 3 },
    canvasRows: 12,
    canvasCols: 12,
    subGrids: [
      { originRow: 0, originCol: 0 },
      { originRow: 0, originCol: 3 },
      { originRow: 3, originCol: 0 },
      { originRow: 3, originCol: 3 },
    ],
  },
  symbols: [1, 2, 3, 4, 5, 6, 7, 8, 9],
  constraintIds: [],
};

describe('multigridLayout - Samurai', () => {
  it('should base a 21-col canvas at 30px', () => {
    expect(multigridLayout.baseCellSize(samuraiVariant)).toBe(30);
  });

  it('should return 369 cell rects', () => {
    expect(multigridLayout.cellRects(samuraiVariant).size).toBe(369);
  });

  it('should place r0c0 at x=0, y=0 with cellSize=40', () => {
    expect(multigridLayout.cellRects(samuraiVariant, 40).get('r0c0')).toEqual({
      x: 0,
      y: 0,
      w: 40,
      h: 40,
    });
  });

  it('should place the center-grid origin r6c6 at x=240, y=240', () => {
    expect(multigridLayout.cellRects(samuraiVariant, 40).get('r6c6')).toEqual({
      x: 240,
      y: 240,
      w: 40,
      h: 40,
    });
  });

  it('should produce an 840x840 canvas', () => {
    expect(multigridLayout.canvasSize(samuraiVariant, 40)).toEqual({ w: 840, h: 840 });
  });
});

describe('multigridLayout - Butterfly', () => {
  it('should base a 12-col canvas at 40px', () => {
    expect(multigridLayout.baseCellSize(butterflyVariant)).toBe(40);
  });

  it('should return 144 cell rects', () => {
    expect(multigridLayout.cellRects(butterflyVariant).size).toBe(144);
  });

  it('should place r0c0 at x=0, y=0 with cellSize=40', () => {
    expect(multigridLayout.cellRects(butterflyVariant).get('r0c0')).toEqual({
      x: 0,
      y: 0,
      w: 40,
      h: 40,
    });
  });

  it('should produce a 480x480 canvas', () => {
    expect(multigridLayout.canvasSize(butterflyVariant)).toEqual({ w: 480, h: 480 });
  });
});
