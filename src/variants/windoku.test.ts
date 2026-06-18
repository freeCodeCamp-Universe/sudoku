import { describe, expect, it } from 'vitest';
import { buildModel } from '@/engine/buildModel';
import { generate } from '@/engine/generate';
import { solve } from '@/engine/solve';
import { validate } from '@/engine/validate';
import { windoku } from './windoku';

function seeded(seed: number): () => number {
  let state = seed;

  return () => {
    state = (state * 1103515245 + 12345) & 0x7fffffff;
    return state / 0x7fffffff;
  };
}

describe('windoku buildModel', () => {
  it('should produce 31 houses (27 standard + 4 windows)', () => {
    const model = buildModel(windoku);

    expect(model.houses).toHaveLength(31);
  });

  it('should include window-0 with the correct 9 cells', () => {
    const model = buildModel(windoku);

    expect(model.houses.find((house) => house.id === 'window-0')?.cells).toEqual([
      'r1c1',
      'r1c2',
      'r1c3',
      'r2c1',
      'r2c2',
      'r2c3',
      'r3c1',
      'r3c2',
      'r3c3',
    ]);
  });

  it('should include window-3 with the correct 9 cells', () => {
    const model = buildModel(windoku);

    expect(model.houses.find((house) => house.id === 'window-3')?.cells).toEqual([
      'r5c5',
      'r5c6',
      'r5c7',
      'r6c5',
      'r6c6',
      'r6c7',
      'r7c5',
      'r7c6',
      'r7c7',
    ]);
  });
});

describe('windoku validate', () => {
  it('should detect a conflict when two window cells share a value', () => {
    const model = buildModel(windoku);
    const values = new Map([
      ['r1c1', 3],
      ['r2c2', 3],
    ]);

    const conflicts = validate(values, model);

    expect(
      conflicts.some(
        (conflict) => conflict.cells.includes('r1c1') && conflict.cells.includes('r2c2')
      )
    ).toBe(true);
  });
});

describe('windoku generate + solve', () => {
  it('should produce a uniquely solvable puzzle', () => {
    const model = buildModel(windoku);
    const { givens } = generate(model, 'intermediate', seeded(20));

    expect(solve(model, givens, { max: 2 })).toHaveLength(1);
  });
});
