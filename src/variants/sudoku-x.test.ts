import { describe, expect, it } from 'vitest';
import { buildModel } from '@/engine/buildModel';
import { generate } from '@/engine/generate';
import { solve } from '@/engine/solve';
import { validate } from '@/engine/validate';
import { sudokuX } from './sudoku-x';

function seeded(seed: number): () => number {
  let state = seed;

  return () => {
    state = (state * 1103515245 + 12345) & 0x7fffffff;
    return state / 0x7fffffff;
  };
}

describe('sudoku-x buildModel', () => {
  it('should produce 29 houses (27 standard + 2 diagonals)', () => {
    const model = buildModel(sudokuX);

    expect(model.houses).toHaveLength(29);
  });

  it('should include diag-main with the 9 main-diagonal cells', () => {
    const model = buildModel(sudokuX);

    expect(model.houses.find((house) => house.id === 'diag-main')?.cells).toEqual([
      'r0c0',
      'r1c1',
      'r2c2',
      'r3c3',
      'r4c4',
      'r5c5',
      'r6c6',
      'r7c7',
      'r8c8',
    ]);
  });

  it('should include diag-anti with the 9 anti-diagonal cells', () => {
    const model = buildModel(sudokuX);

    expect(model.houses.find((house) => house.id === 'diag-anti')?.cells).toEqual([
      'r0c8',
      'r1c7',
      'r2c6',
      'r3c5',
      'r4c4',
      'r5c3',
      'r6c2',
      'r7c1',
      'r8c0',
    ]);
  });
});

describe('sudoku-x validate', () => {
  it('should detect a conflict when two diagonal cells share a value', () => {
    const model = buildModel(sudokuX);
    const values = new Map([
      ['r0c0', 5],
      ['r1c1', 5],
    ]);

    const conflicts = validate(values, model);

    expect(conflicts.some((conflict) => conflict.cells.includes('r0c0') && conflict.cells.includes('r1c1'))).toBe(true);
  });
});

describe('sudoku-x generate + solve', () => {
  it('should produce a uniquely solvable puzzle', () => {
    const model = buildModel(sudokuX);
    const { givens } = generate(model, 'intermediate', seeded(10));

    expect(solve(model, givens, { max: 2 })).toHaveLength(1);
  });
});
