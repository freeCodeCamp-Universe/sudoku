import { describe, expect, it } from 'vitest';
import { uniqueness } from './constraints/uniqueness';
import { cellId, gridCells, standardHouses } from './grid';
import { solve } from './solve';
import type { Values, VariantModel } from './types';

const model: VariantModel = {
  cells: gridCells(9),
  houses: standardHouses(9, { rows: 3, cols: 3 }),
  constraints: [uniqueness],
  symbols: [1, 2, 3, 4, 5, 6, 7, 8, 9],
};

const puzzle = [
  [5, 3, 0, 0, 7, 0, 0, 0, 0],
  [6, 0, 0, 1, 9, 5, 0, 0, 0],
  [0, 9, 8, 0, 0, 0, 0, 6, 0],
  [8, 0, 0, 0, 6, 0, 0, 0, 3],
  [4, 0, 0, 8, 0, 3, 0, 0, 1],
  [7, 0, 0, 0, 2, 0, 0, 0, 6],
  [0, 6, 0, 0, 0, 0, 2, 8, 0],
  [0, 0, 0, 4, 1, 9, 0, 0, 5],
  [0, 0, 0, 0, 8, 0, 0, 7, 9],
];

function given(): Values {
  const values: Values = new Map();
  puzzle.forEach((row, rowIndex) =>
    row.forEach((value, colIndex) => {
      if (value !== 0) {
        values.set(cellId(rowIndex, colIndex), value);
      }
    })
  );
  return values;
}

describe('solve', () => {
  it('should find exactly one solution for a unique puzzle', () => {
    const solutions = solve(model, given(), { max: 2 });
    expect(solutions).toHaveLength(1);
  });

  it('should fully populate the solved board', () => {
    const [solution] = solve(model, given(), { max: 1 });
    expect(solution.size).toBe(81);
    expect(solution.get('r0c2')).toBe(4);
  });

  it('should return no solutions for a contradictory board', () => {
    const values = given();
    values.set('r0c2', 5);
    expect(solve(model, values, { max: 1 })).toEqual([]);
  });
});
