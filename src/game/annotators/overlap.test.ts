import { describe, expect, it } from 'vitest';
import type { House, VariantModel } from '@/engine/types';
import type { AnnotatorContext, CellState } from '@/game/gameTypes';
import { overlapAnnotator } from './overlap';

const houses: House[] = [
  { id: 'g0-box-2-2', cells: ['r6c6', 'r6c7', 'r7c6'] },
  { id: 'g0-row-6', cells: ['r6c6', 'r6c7'] },
  { id: 'g2-box-0-0', cells: ['r6c6', 'r6c7', 'r7c6'] },
  { id: 'g1-box-0-0', cells: ['r0c12'] },
];

function makeCtx(): AnnotatorContext {
  const model: VariantModel = { cells: [], houses, constraints: [], symbols: [] };

  return {
    values: new Map(),
    model,
    cellState: (_id: string): CellState => ({
      candidates: [],
      given: false,
      selected: false,
      conflict: false,
    }),
  };
}

describe('overlapAnnotator', () => {
  it('should describe a cell shared by two sub-grids', () => {
    expect(overlapAnnotator.describe('r6c6', makeCtx())).toBe('shared by 2 grids');
  });

  it('should return null for a cell that belongs to a single sub-grid', () => {
    expect(overlapAnnotator.describe('r0c12', makeCtx())).toBeNull();
  });

  it('should return null for a cell in no sub-grid house', () => {
    expect(overlapAnnotator.describe('r5c5', makeCtx())).toBeNull();
  });
});
