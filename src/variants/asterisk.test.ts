import { describe, expect, it } from 'vitest';
import { buildModel } from '@/engine/buildModel';
import { generate } from '@/engine/generate';
import { solve } from '@/engine/solve';
import { validate } from '@/engine/validate';
import { asterisk } from './asterisk';

function seeded(seed: number): () => number {
  let state = seed;

  return () => {
    state = (state * 1103515245 + 12345) & 0x7fffffff;
    return state / 0x7fffffff;
  };
}

describe('asterisk buildModel', () => {
  it('should produce 28 houses (27 standard + 1 asterisk)', () => {
    const model = buildModel(asterisk);

    expect(model.houses).toHaveLength(28);
  });

  it('should include the asterisk house with the 9 correct cells', () => {
    const model = buildModel(asterisk);

    expect(model.houses.find((house) => house.id === 'asterisk')?.cells).toEqual([
      'r1c4',
      'r2c2',
      'r2c6',
      'r4c1',
      'r4c4',
      'r4c7',
      'r6c2',
      'r6c6',
      'r7c4',
    ]);
  });
});

describe('asterisk validate', () => {
  it('should detect a conflict when two asterisk cells share a value', () => {
    const model = buildModel(asterisk);
    const values = new Map([
      ['r1c4', 7],
      ['r4c4', 7],
    ]);

    const conflicts = validate(values, model);

    expect(
      conflicts.some(
        (conflict) => conflict.cells.includes('r1c4') && conflict.cells.includes('r4c4')
      )
    ).toBe(true);
  });
});

describe('asterisk generate + solve', () => {
  it('should produce a uniquely solvable puzzle', () => {
    const model = buildModel(asterisk);
    const { givens } = generate(model, 'intermediate', seeded(30));

    expect(solve(model, givens, { max: 2 })).toHaveLength(1);
  });
});
