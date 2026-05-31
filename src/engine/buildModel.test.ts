import { describe, expect, it } from 'vitest';
import { buildModel } from './buildModel';
import type { BoardLayout, House, MultiGridLayout, TriangularLayout, Variant } from './types';

const classicLike: Variant = {
  id: 'classic',
  name: 'Classic Sudoku',
  description: 'Test variant.',
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
      description: 'Test variant.',
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
      description: 'Test variant.',
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
      description: 'Test variant.',
      difficulty: 'intermediate',
      layout: {
        kind: 'mystery',
      } as unknown as BoardLayout,
      symbols: [1],
      constraintIds: [],
    };

    expect(() => buildModel(variant)).toThrow('Unsupported layout kind');
  });
});

describe('buildCells for multigrid (Butterfly 12x12)', () => {
  const butterflyLayout: MultiGridLayout = {
    kind: 'multigrid',
    subGridSize: 9,
    box: { rows: 3, cols: 3 },
    canvasRows: 12,
    canvasCols: 12,
    subGrids: [
      { originRow: 0, originCol: 0 },
      { originRow: 0, originCol: 3 },
      { originRow: 3, originCol: 0 },
      { originRow: 3, originCol: 3 },
    ],
  };
  const variant: Variant = {
    id: 'butterfly',
    name: 'Butterfly',
    description: 'Test variant.',
    difficulty: 'intermediate',
    layout: butterflyLayout,
    symbols: [1, 2, 3, 4, 5, 6, 7, 8, 9],
    constraintIds: [],
    buildHouses: () => [],
  };

  it('should build 144 cells for a 12x12 butterfly board', () => {
    const model = buildModel(variant);

    expect(model.cells).toHaveLength(144);
  });

  it('should have no duplicate cell ids', () => {
    const model = buildModel(variant);
    const ids = model.cells.map((cell) => cell.id);

    expect(new Set(ids).size).toBe(ids.length);
  });

  it('should tag every cell with a grid index for the first sub-grid it belongs to', () => {
    const model = buildModel(variant);
    const firstCell = model.cells.find((cell) => cell.id === 'r0c0');

    expect(firstCell?.grid).toBeDefined();
  });
});

describe('buildCells for multigrid (Samurai 21x21)', () => {
  const samuraiLayout: MultiGridLayout = {
    kind: 'multigrid',
    subGridSize: 9,
    box: { rows: 3, cols: 3 },
    canvasRows: 21,
    canvasCols: 21,
    subGrids: [
      { originRow: 0, originCol: 0 },
      { originRow: 0, originCol: 12 },
      { originRow: 6, originCol: 6 },
      { originRow: 12, originCol: 0 },
      { originRow: 12, originCol: 12 },
    ],
  };
  const variant: Variant = {
    id: 'samurai',
    name: 'Samurai',
    description: 'Test variant.',
    difficulty: 'advanced',
    layout: samuraiLayout,
    symbols: [1, 2, 3, 4, 5, 6, 7, 8, 9],
    constraintIds: [],
    buildHouses: () => [],
  };

  it('should build 369 cells for a samurai board', () => {
    const model = buildModel(variant);

    expect(model.cells).toHaveLength(369);
  });
});

describe('buildCells for triangular (Sujiken 9x9)', () => {
  const triangularLayout: TriangularLayout = { kind: 'triangular', size: 9 };
  const variant: Variant = {
    id: 'sujiken',
    name: 'Sujiken',
    description: 'Test variant.',
    difficulty: 'intermediate',
    layout: triangularLayout,
    symbols: [1, 2, 3, 4, 5, 6, 7, 8, 9],
    constraintIds: [],
    buildHouses: () => [],
  };

  it('should build 45 cells for a triangular 9x9 board', () => {
    const model = buildModel(variant);

    expect(model.cells).toHaveLength(45);
  });

  it('should only include cells where col <= row', () => {
    const model = buildModel(variant);

    expect(model.cells.every((cell) => cell.col <= cell.row)).toBe(true);
  });

  it('should include the diagonal cell r8c8', () => {
    const model = buildModel(variant);

    expect(model.cells.some((cell) => cell.id === 'r8c8')).toBe(true);
  });

  it('should not include void cell r0c1', () => {
    const model = buildModel(variant);

    expect(model.cells.some((cell) => cell.id === 'r0c1')).toBe(false);
  });
});
