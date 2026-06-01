import { describe, expect, it } from 'vitest';
import { uniqueness } from './constraints/uniqueness';
import { gridCells, standardHouses } from './grid';
import type { Values, VariantModel } from './types';
import { validate } from './validate';

const model: VariantModel = {
  cells: gridCells(9),
  houses: standardHouses(9, { rows: 3, cols: 3 }),
  constraints: [uniqueness],
  symbols: [1, 2, 3, 4, 5, 6, 7, 8, 9],
};

describe('validate', () => {
  it('should aggregate conflicts from every constraint', () => {
    const values: Values = new Map([
      ['r0c0', 1],
      ['r1c0', 1],
    ]);

    expect(validate(values, model).length).toBeGreaterThan(0);
  });

  it('should return an empty array when nothing is filled', () => {
    expect(validate(new Map(), model)).toEqual([]);
  });
});
