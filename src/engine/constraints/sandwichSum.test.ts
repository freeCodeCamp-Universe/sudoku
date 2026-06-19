import { describe, expect, it } from 'vitest';
import { cellId, gridCells, range, standardHouses } from '../grid';
import type { Values, VariantModel } from '../types';
import { sandwichSum } from './sandwichSum';

function makeModel(rows: number[], cols: number[] = Array(9).fill(0)): VariantModel {
  return {
    cells: gridCells(9),
    houses: standardHouses(9, { rows: 3, cols: 3 }),
    constraints: [],
    symbols: [1, 2, 3, 4, 5, 6, 7, 8, 9],
    structure: { rows, cols },
  };
}

describe('sandwichSum constraint', () => {
  it('should allow a complete row whose between-sum matches its clue', () => {
    const values: Values = new Map([
      [cellId(0, 0), 1],
      [cellId(0, 1), 5],
      [cellId(0, 2), 9],
      [cellId(0, 3), 2],
      [cellId(0, 4), 3],
      [cellId(0, 5), 4],
      [cellId(0, 6), 6],
      [cellId(0, 7), 7],
      [cellId(0, 8), 8],
    ]);

    expect(sandwichSum.conflicts(values, makeModel([5, 0, 0, 0, 0, 0, 0, 0, 0]))).toEqual([]);
  });

  it('should report a conflict for a complete row whose between-sum does not match its clue', () => {
    const values: Values = new Map([
      [cellId(0, 0), 1],
      [cellId(0, 1), 5],
      [cellId(0, 2), 9],
      [cellId(0, 3), 2],
      [cellId(0, 4), 3],
      [cellId(0, 5), 4],
      [cellId(0, 6), 6],
      [cellId(0, 7), 7],
      [cellId(0, 8), 8],
    ]);

    const conflicts = sandwichSum.conflicts(values, makeModel([6, 0, 0, 0, 0, 0, 0, 0, 0]));

    expect(conflicts.some((conflict) => conflict.constraintId === 'sandwichSum')).toBe(true);
  });

  it('should report a conflict for a complete column whose between-sum does not match its clue', () => {
    const values: Values = new Map([
      [cellId(0, 0), 1],
      [cellId(1, 0), 5],
      [cellId(2, 0), 9],
      [cellId(3, 0), 2],
      [cellId(4, 0), 3],
      [cellId(5, 0), 4],
      [cellId(6, 0), 6],
      [cellId(7, 0), 7],
      [cellId(8, 0), 8],
    ]);

    const conflicts = sandwichSum.conflicts(
      values,
      makeModel([0, 0, 0, 0, 0, 0, 0, 0, 0], [6, 0, 0, 0, 0, 0, 0, 0, 0])
    );

    expect(conflicts.some((conflict) => conflict.cells.includes(cellId(0, 0)))).toBe(true);
  });

  it('should skip a complete row that is missing 1 or 9', () => {
    const values: Values = new Map(range(9).map((index) => [cellId(0, index), 2 + index]));

    expect(sandwichSum.conflicts(values, makeModel([5]))).toEqual([]);
  });

  it('should skip a partially-filled row', () => {
    const values: Values = new Map([
      [cellId(0, 0), 1],
      [cellId(0, 1), 5],
      [cellId(0, 2), 9],
    ]);

    expect(sandwichSum.conflicts(values, makeModel([5]))).toEqual([]);
  });

  it('should be a no-op when structure is absent', () => {
    const model: VariantModel = {
      cells: gridCells(9),
      houses: [],
      constraints: [],
      symbols: [1, 2, 3, 4, 5, 6, 7, 8, 9],
    };
    const values: Values = new Map([
      [cellId(0, 0), 1],
      [cellId(0, 1), 5],
      [cellId(0, 2), 9],
      [cellId(0, 3), 2],
      [cellId(0, 4), 3],
      [cellId(0, 5), 4],
      [cellId(0, 6), 6],
      [cellId(0, 7), 7],
      [cellId(0, 8), 8],
    ]);

    expect(sandwichSum.conflicts(values, model)).toEqual([]);
  });

  it('should reject a candidate that makes the between-sum exceed the clue, and allow one that still fits', () => {
    const strictModel = makeModel([5, 0, 0, 0, 0, 0, 0, 0, 0]);
    const looseModel = makeModel([6, 0, 0, 0, 0, 0, 0, 0, 0]);
    const values: Values = new Map([
      [cellId(0, 0), 1],
      [cellId(0, 2), 9],
    ]);

    expect(sandwichSum.permits?.(values, cellId(0, 1), 6, strictModel)).toBe(false);
    expect(sandwichSum.permits?.(values, cellId(0, 1), 6, looseModel)).toBe(true);
  });
});
