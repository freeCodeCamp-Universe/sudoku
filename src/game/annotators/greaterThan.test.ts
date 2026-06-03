import { describe, expect, it } from 'vitest';
import { cellId, gridCells, standardHouses } from '@/engine/grid';
import type { Values, VariantModel } from '@/engine/types';
import type { AnnotatorContext, CellState } from '@/game/gameTypes';
import type { Relation } from '@/engine/constraints/greaterThan';
import { greaterThanAnnotator } from './greaterThan';

function makeCtx(relations: Relation[], values: Values = new Map()): AnnotatorContext {
  const model: VariantModel = {
    cells: gridCells(9),
    houses: standardHouses(9, { rows: 3, cols: 3 }),
    constraints: [],
    symbols: [1, 2, 3, 4, 5, 6, 7, 8, 9],
    structure: { relations },
  };

  return {
    values,
    model,
    cellState: (_id: string): CellState => ({
      candidates: [],
      given: false,
      selected: false,
      conflict: false,
    }),
  };
}

describe('greaterThanAnnotator', () => {
  it('should describe a cell that is the greater side of one relation', () => {
    const relations: Relation[] = [{ greater: cellId(0, 0), lesser: cellId(0, 1) }];

    expect(greaterThanAnnotator.describe(cellId(0, 0), makeCtx(relations))).toBe(
      'greater than the cell to the right'
    );
  });

  it('should describe a cell that is the lesser side of one relation', () => {
    const relations: Relation[] = [{ greater: cellId(0, 0), lesser: cellId(0, 1) }];

    expect(greaterThanAnnotator.describe(cellId(0, 1), makeCtx(relations))).toBe(
      'less than the cell to the left'
    );
  });

  it('should describe a cell with multiple relations', () => {
    const relations: Relation[] = [
      { greater: cellId(0, 0), lesser: cellId(0, 1) },
      { greater: cellId(1, 0), lesser: cellId(0, 0) },
    ];

    expect(greaterThanAnnotator.describe(cellId(0, 0), makeCtx(relations))).toBe(
      'greater than the cell to the right, less than the cell below'
    );
  });

  it('should return null for a cell with no inequality relations', () => {
    expect(greaterThanAnnotator.describe(cellId(5, 5), makeCtx([]))).toBeNull();
  });
});
