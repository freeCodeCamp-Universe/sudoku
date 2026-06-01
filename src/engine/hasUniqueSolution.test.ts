import { describe, expect, it, should } from 'vitest';
import { uniqueness } from './constraints/uniqueness';
import { cellId, gridCells, standardHouses } from './grid';
import { hasUniqueSolution } from './solve';
import type { Values, VariantModel } from './types';

const shouldAssert = should();

const classicModel: VariantModel = {
  cells: gridCells(9),
  houses: standardHouses(9, { rows: 3, cols: 3 }),
  constraints: [uniqueness],
  symbols: [1, 2, 3, 4, 5, 6, 7, 8, 9],
};

const miniModel: VariantModel = {
  cells: gridCells(4),
  houses: standardHouses(4, { rows: 2, cols: 2 }),
  constraints: [uniqueness],
  symbols: [1, 2, 3, 4],
};

const solvedGrid = [
  [5, 3, 4, 6, 7, 8, 9, 1, 2],
  [6, 7, 2, 1, 9, 5, 3, 4, 8],
  [1, 9, 8, 3, 4, 2, 5, 6, 7],
  [8, 5, 9, 7, 6, 1, 4, 2, 3],
  [4, 2, 6, 8, 5, 3, 7, 9, 1],
  [7, 1, 3, 9, 2, 4, 8, 5, 6],
  [9, 6, 1, 5, 3, 7, 2, 8, 4],
  [2, 8, 7, 4, 1, 9, 6, 3, 5],
  [3, 4, 5, 2, 8, 6, 1, 7, 9],
];

function toValues(grid: number[][]): Values {
  const values: Values = new Map();

  grid.forEach((row, rowIndex) =>
    row.forEach((value, colIndex) => {
      values.set(cellId(rowIndex, colIndex), value);
    })
  );

  return values;
}

describe('hasUniqueSolution', () => {
  it('should return true when exactly one solution is proven', () => {
    const result = hasUniqueSolution(classicModel, toValues(solvedGrid));
    shouldAssert.equal(result, true);
    expect(result).toBe(true);
  });

  it('should return false when the puzzle has multiple solutions', () => {
    const result = hasUniqueSolution(miniModel, new Map());
    shouldAssert.equal(result, false);
    expect(result).toBe(false);
  });

  it('should return false when the search aborts on node budget', () => {
    const result = hasUniqueSolution(miniModel, new Map(), { nodeBudget: 0 });
    shouldAssert.equal(result, false);
    expect(result).toBe(false);
  });
});
