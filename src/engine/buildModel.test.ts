import { describe, expect, it } from 'vitest';
import { buildModel } from './buildModel';
import type { BoardLayout, House, Variant } from './types';

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

describe('buildModel with buildHouses override', () => {
  it('should use buildHouses when provided, replacing defaultHouses', () => {
    const customHouse: House = { id: 'custom', cells: ['r0c0', 'r0c1'] };
    const variant: Variant = {
      id: 'custom',
      name: 'Custom',
      difficulty: 'intermediate',
      layout: { kind: 'grid', size: 9, box: { rows: 3, cols: 3 } },
      symbols: [1, 2, 3, 4, 5, 6, 7, 8, 9],
      constraintIds: ['uniqueness'],
      buildHouses: () => [customHouse],
    };

    const model = buildModel(variant);

    expect(model.houses).toEqual([customHouse]);
  });

  it('should append extraHouses to defaultHouses', () => {
    const extraHouse: House = { id: 'diagonal', cells: ['r0c0', 'r1c1', 'r2c2'] };
    const variant: Variant = {
      id: 'extra',
      name: 'Extra',
      difficulty: 'intermediate',
      layout: { kind: 'grid', size: 9, box: { rows: 3, cols: 3 } },
      symbols: [1, 2, 3, 4, 5, 6, 7, 8, 9],
      constraintIds: ['uniqueness'],
      extraHouses: () => [extraHouse],
    };

    const model = buildModel(variant);

    expect(model.houses).toHaveLength(28);
    expect(model.houses[model.houses.length - 1]).toEqual(extraHouse);
  });

  it('should throw for unsupported layout kind', () => {
    const variant: Variant = {
      id: 'bad',
      name: 'Bad',
      difficulty: 'intermediate',
      layout: {
        kind: 'multigrid',
        size: 9,
        box: { rows: 3, cols: 3 },
      } as unknown as BoardLayout,
      symbols: [1],
      constraintIds: [],
    };

    expect(() => buildModel(variant)).toThrow('Unsupported layout kind');
  });
});
