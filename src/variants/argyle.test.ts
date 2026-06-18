import { describe, expect, it } from 'vitest';
import { buildModel } from '@/engine/buildModel';
import { generate } from '@/engine/generate';
import { solve } from '@/engine/solve';
import { validate } from '@/engine/validate';
import { argyle } from './argyle';

function seeded(seed: number): () => number {
  let state = seed;

  return () => {
    state = (state * 1103515245 + 12345) & 0x7fffffff;
    return state / 0x7fffffff;
  };
}

describe('argyle buildModel', () => {
  it('should produce 35 houses (27 standard + 8 argyle stripes)', () => {
    const model = buildModel(argyle);

    expect(model.houses).toHaveLength(35);
  });

  it('should include argyle-d1-m4 as a 5-cell stripe', () => {
    const model = buildModel(argyle);

    expect(model.houses.find((house) => house.id === 'argyle-d1-m4')?.cells).toEqual([
      'r0c4',
      'r1c5',
      'r2c6',
      'r3c7',
      'r4c8',
    ]);
  });

  it('should include argyle-d1-m1 as an 8-cell stripe', () => {
    const model = buildModel(argyle);

    expect(model.houses.find((house) => house.id === 'argyle-d1-m1')?.cells).toEqual([
      'r0c1',
      'r1c2',
      'r2c3',
      'r3c4',
      'r4c5',
      'r5c6',
      'r6c7',
      'r7c8',
    ]);
  });

  it('should include argyle-d1-1 as an 8-cell stripe', () => {
    const model = buildModel(argyle);

    expect(model.houses.find((house) => house.id === 'argyle-d1-1')?.cells).toEqual([
      'r1c0',
      'r2c1',
      'r3c2',
      'r4c3',
      'r5c4',
      'r6c5',
      'r7c6',
      'r8c7',
    ]);
  });

  it('should include argyle-d1-4 as a 5-cell stripe', () => {
    const model = buildModel(argyle);

    expect(model.houses.find((house) => house.id === 'argyle-d1-4')?.cells).toEqual([
      'r4c0',
      'r5c1',
      'r6c2',
      'r7c3',
      'r8c4',
    ]);
  });

  it('should include argyle-d2-4 as a 5-cell stripe', () => {
    const model = buildModel(argyle);

    expect(model.houses.find((house) => house.id === 'argyle-d2-4')?.cells).toEqual([
      'r0c4',
      'r1c3',
      'r2c2',
      'r3c1',
      'r4c0',
    ]);
  });

  it('should include argyle-d2-7 as an 8-cell stripe', () => {
    const model = buildModel(argyle);

    expect(model.houses.find((house) => house.id === 'argyle-d2-7')?.cells).toEqual([
      'r0c7',
      'r1c6',
      'r2c5',
      'r3c4',
      'r4c3',
      'r5c2',
      'r6c1',
      'r7c0',
    ]);
  });

  it('should include argyle-d2-9 as an 8-cell stripe', () => {
    const model = buildModel(argyle);

    expect(model.houses.find((house) => house.id === 'argyle-d2-9')?.cells).toEqual([
      'r1c8',
      'r2c7',
      'r3c6',
      'r4c5',
      'r5c4',
      'r6c3',
      'r7c2',
      'r8c1',
    ]);
  });

  it('should include argyle-d2-12 as a 5-cell stripe', () => {
    const model = buildModel(argyle);

    expect(model.houses.find((house) => house.id === 'argyle-d2-12')?.cells).toEqual([
      'r4c8',
      'r5c7',
      'r6c6',
      'r7c5',
      'r8c4',
    ]);
  });
});

describe('argyle validate', () => {
  it('should detect a conflict when two cells on the same D1 stripe share a value', () => {
    const model = buildModel(argyle);
    const values = new Map([
      ['r1c0', 5],
      ['r4c3', 5],
    ]);

    const conflicts = validate(values, model);

    expect(
      conflicts.some(
        (conflict) => conflict.cells.includes('r1c0') && conflict.cells.includes('r4c3')
      )
    ).toBe(true);
  });

  it('should detect a conflict when two cells on the same D2 stripe share a value', () => {
    const model = buildModel(argyle);
    const values = new Map([
      ['r0c7', 5],
      ['r5c2', 5],
    ]);

    const conflicts = validate(values, model);

    expect(
      conflicts.some(
        (conflict) => conflict.cells.includes('r0c7') && conflict.cells.includes('r5c2')
      )
    ).toBe(true);
  });
});

describe('argyle generate + solve', () => {
  it('should produce a uniquely solvable puzzle', () => {
    const model = buildModel(argyle);
    const { givens } = generate(model, 'advanced', seeded(40));

    expect(solve(model, givens, { max: 2 })).toHaveLength(1);
  });
});
