import { describe, expect, it } from 'vitest';
import type { Variant } from '@/engine/types';
import { triangularLayout } from './triangular';

const sujikenVariant: Variant = {
  id: 'sujiken',
  name: 'Sujiken',
  description: 'Test variant.',
  popularity: 0,
  difficulty: 'intermediate',
  layout: { kind: 'triangular', size: 9 },
  symbols: [1, 2, 3, 4, 5, 6, 7, 8, 9],
  constraintIds: [],
};

describe('triangularLayout', () => {
  it('should base cells at 52px', () => {
    expect(triangularLayout.baseCellSize(sujikenVariant)).toBe(52);
  });

  it('should return 45 cell rects', () => {
    expect(triangularLayout.cellRects(sujikenVariant).size).toBe(45);
  });

  it('should scale cell rects with an explicit override', () => {
    expect(triangularLayout.cellRects(sujikenVariant, 38).get('r1c1')).toEqual({
      x: 38,
      y: 38,
      w: 38,
      h: 38,
    });
  });

  it('should scale the canvas with an explicit override', () => {
    expect(triangularLayout.canvasSize(sujikenVariant, 38)).toEqual({ w: 342, h: 342 });
  });

  it('should not include void cell r0c1', () => {
    expect(triangularLayout.cellRects(sujikenVariant).has('r0c1')).toBe(false);
  });

  it('should place r0c0 at x=0, y=0 with w=52, h=52', () => {
    expect(triangularLayout.cellRects(sujikenVariant).get('r0c0')).toEqual({
      x: 0,
      y: 0,
      w: 52,
      h: 52,
    });
  });

  it('should place diagonal cell r1c1 at x=52, y=52', () => {
    expect(triangularLayout.cellRects(sujikenVariant).get('r1c1')).toEqual({
      x: 52,
      y: 52,
      w: 52,
      h: 52,
    });
  });

  it('should place r8c0 at x=0, y=416', () => {
    expect(triangularLayout.cellRects(sujikenVariant).get('r8c0')).toEqual({
      x: 0,
      y: 416,
      w: 52,
      h: 52,
    });
  });

  it('should produce a square canvas matching size x cellSize', () => {
    expect(triangularLayout.canvasSize(sujikenVariant)).toEqual({ w: 468, h: 468 });
  });
});
