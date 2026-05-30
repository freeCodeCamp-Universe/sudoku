import { describe, expect, it } from 'vitest';
import { buildModel } from './buildModel';
import type { Variant } from './types';

const classicLike: Variant = {
  id: 'classic',
  name: 'Classic Sudoku',
  difficulty: 'intermediate',
  layout: { kind: 'grid', size: 9, box: { rows: 3, cols: 3 } },
  symbols: [1, 2, 3, 4, 5, 6, 7, 8, 9],
  constraintIds: ['uniqueness'],
};

describe('buildModel', () => {
  it('should build 81 cells, 27 houses, and resolve constraints for a 9x9 grid variant', () => {
    const model = buildModel(classicLike);

    expect(model.cells).toHaveLength(81);
    expect(model.houses).toHaveLength(27);
    expect(model.constraints.map((constraint) => constraint.id)).toEqual(['uniqueness']);
    expect(model.symbols).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9]);
  });
});
