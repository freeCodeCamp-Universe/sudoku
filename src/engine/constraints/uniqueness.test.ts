import { describe, expect, it } from 'vitest';
import { standardHouses } from '../grid';
import type { Values, VariantModel } from '../types';
import { uniqueness } from './uniqueness';

const model: VariantModel = {
  cells: [],
  houses: standardHouses(9, { rows: 3, cols: 3 }),
  constraints: [],
  symbols: [1, 2, 3, 4, 5, 6, 7, 8, 9],
};

describe('uniqueness constraint', () => {
  it('should report a conflict when a value repeats in a row', () => {
    const values: Values = new Map([
      ['r0c0', 5],
      ['r0c4', 5],
    ]);

    const conflicts = uniqueness.conflicts(values, model);

    expect(
      conflicts.some(
        (conflict) => conflict.cells.includes('r0c0') && conflict.cells.includes('r0c4')
      )
    ).toBe(true);
  });

  it('should report no conflicts for a clean partial assignment', () => {
    const values: Values = new Map([
      ['r0c0', 5],
      ['r0c4', 6],
    ]);

    expect(uniqueness.conflicts(values, model)).toEqual([]);
  });

  it('should not permit placing a value already present in the same box', () => {
    const values: Values = new Map([['r0c0', 7]]);

    expect(uniqueness.permits?.(values, 'r1c1', 7, model)).toBe(false);
    expect(uniqueness.permits?.(values, 'r1c1', 8, model)).toBe(true);
  });
});
