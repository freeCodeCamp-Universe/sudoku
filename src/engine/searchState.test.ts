import { describe, expect, it } from 'vitest';
import { createSearchState, pickNextCell } from './searchState';
import type { Constraint, VariantModel } from './types';

const constrainedCell: Constraint = {
  id: 'testConstraint',
  conflicts: () => [],
  permits: (_values, cellId, value) => cellId !== 'a' || value === 1,
};

const model: VariantModel = {
  cells: [
    { id: 'a', row: 0, col: 0 },
    { id: 'b', row: 0, col: 1 },
  ],
  houses: [],
  constraints: [constrainedCell],
  symbols: [1, 2, 3],
};

describe('pickNextCell', () => {
  it('should select the cell with fewest constraint-valid candidates', () => {
    const values = new Map();
    const state = createSearchState(model, values);

    expect(pickNextCell(state, values, model)).toEqual({
      cellId: 'a',
      candidates: [1],
    });
  });
});
