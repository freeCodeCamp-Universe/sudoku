import { describe, expect, it } from 'vitest';
import { gridCells, standardHouses } from '@/engine/grid';
import type { VariantModel } from '@/engine/types';
import type { Cage, AnnotatorContext, CellState } from '@/game/gameTypes';
import { cageSumAnnotator } from './cage';

const cages: Cage[] = [
  { cells: ['r0c0', 'r0c1', 'r0c2'], sum: 15 },
  { cells: ['r1c0', 'r2c0'], sum: 8 },
];

const model: VariantModel = {
  cells: gridCells(9),
  houses: standardHouses(9, { rows: 3, cols: 3 }),
  constraints: [],
  symbols: [1, 2, 3, 4, 5, 6, 7, 8, 9],
  structure: { cages },
};

const ctx: AnnotatorContext = {
  values: new Map(),
  model,
  cellState: (_id: string): CellState => ({
    candidates: [],
    given: false,
    selected: false,
    conflict: false,
  }),
};

describe('cageSumAnnotator', () => {
  it('should return "cage sum 15, 3 cells" for a cell in the first cage', () => {
    expect(cageSumAnnotator.describe('r0c0', ctx)).toBe('cage sum 15, 3 cells');
  });

  it('should return "cage sum 8, 2 cells" for a cell in the second cage', () => {
    expect(cageSumAnnotator.describe('r1c0', ctx)).toBe('cage sum 8, 2 cells');
  });

  it('should return null for a cell not in any cage', () => {
    expect(cageSumAnnotator.describe('r4c4', ctx)).toBeNull();
  });

  it('should return null when structure has no cages', () => {
    const noStructureCtx: AnnotatorContext = {
      ...ctx,
      model: { ...model, structure: undefined },
    };

    expect(cageSumAnnotator.describe('r0c0', noStructureCtx)).toBeNull();
  });
});
