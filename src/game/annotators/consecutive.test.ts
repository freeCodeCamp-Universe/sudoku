import { describe, expect, it } from 'vitest';
import { cellId, gridCells, standardHouses } from '@/engine/grid';
import type { Values, VariantModel } from '@/engine/types';
import type { AnnotatorContext, CellState } from '@/game/gameTypes';
import type { Mark } from '@/engine/constraints/consecutive';
import { consecutiveAnnotator } from './consecutive';

function makeCtx(marks: Mark[], values: Values = new Map()): AnnotatorContext {
  const model: VariantModel = {
    cells: gridCells(9),
    houses: standardHouses(9, { rows: 3, cols: 3 }),
    constraints: [],
    symbols: [1, 2, 3, 4, 5, 6, 7, 8, 9],
    structure: { marks },
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

describe('consecutiveAnnotator', () => {
  it('should describe a cell that participates in marked consecutive pairs', () => {
    const marks: Mark[] = [
      { a: cellId(0, 0), b: cellId(0, 1) },
      { a: cellId(1, 0), b: cellId(0, 0) },
    ];
    const result = consecutiveAnnotator.describe(cellId(0, 0), makeCtx(marks));

    expect(result).toBe('consecutive with the cell to the right, the cell below');
  });

  it('should return null for a cell with no marked consecutive pairs', () => {
    expect(consecutiveAnnotator.describe(cellId(5, 5), makeCtx([]))).toBeNull();
  });
});
