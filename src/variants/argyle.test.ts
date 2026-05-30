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
  it('should produce 33 houses (27 standard + 6 argyle stripes)', () => {
    const model = buildModel(argyle);

    expect(model.houses).toHaveLength(33);
  });

  it('should include argyle-d1-0 as the full main diagonal', () => {
    const model = buildModel(argyle);

    expect(model.houses.find((house) => house.id === 'argyle-d1-0')?.cells).toEqual([
      'r0c0', 'r1c1', 'r2c2', 'r3c3', 'r4c4', 'r5c5', 'r6c6', 'r7c7', 'r8c8',
    ]);
  });

  it('should include argyle-d1-m3 as a 6-cell shorter stripe', () => {
    const model = buildModel(argyle);

    expect(model.houses.find((house) => house.id === 'argyle-d1-m3')?.cells).toEqual([
      'r0c3', 'r1c4', 'r2c5', 'r3c6', 'r4c7', 'r5c8',
    ]);
  });

  it('should include argyle-d1-3 as a 6-cell shorter stripe', () => {
    const model = buildModel(argyle);

    expect(model.houses.find((house) => house.id === 'argyle-d1-3')?.cells).toEqual([
      'r3c0', 'r4c1', 'r5c2', 'r6c3', 'r7c4', 'r8c5',
    ]);
  });

  it('should include argyle-d2-8 as the full anti-diagonal', () => {
    const model = buildModel(argyle);

    expect(model.houses.find((house) => house.id === 'argyle-d2-8')?.cells).toEqual([
      'r0c8', 'r1c7', 'r2c6', 'r3c5', 'r4c4', 'r5c3', 'r6c2', 'r7c1', 'r8c0',
    ]);
  });

  it('should include argyle-d2-5 as a 6-cell shorter stripe', () => {
    const model = buildModel(argyle);

    expect(model.houses.find((house) => house.id === 'argyle-d2-5')?.cells).toEqual([
      'r0c5', 'r1c4', 'r2c3', 'r3c2', 'r4c1', 'r5c0',
    ]);
  });

  it('should include argyle-d2-11 as a 6-cell shorter stripe', () => {
    const model = buildModel(argyle);

    expect(model.houses.find((house) => house.id === 'argyle-d2-11')?.cells).toEqual([
      'r3c8', 'r4c7', 'r5c6', 'r6c5', 'r7c4', 'r8c3',
    ]);
  });
});

describe('argyle validate', () => {
  it('should detect a conflict when two cells on the same D1 stripe share a value', () => {
    const model = buildModel(argyle);
    const values = new Map([
      ['r0c0', 4],
      ['r1c1', 4],
    ]);

    const conflicts = validate(values, model);

    expect(conflicts.some((conflict) => conflict.cells.includes('r0c0') && conflict.cells.includes('r1c1'))).toBe(true);
  });

  it('should detect a conflict when two cells on the same D2 stripe share a value', () => {
    const model = buildModel(argyle);
    const values = new Map([
      ['r0c8', 6],
      ['r1c7', 6],
    ]);

    const conflicts = validate(values, model);

    expect(conflicts.some((conflict) => conflict.cells.includes('r0c8') && conflict.cells.includes('r1c7'))).toBe(true);
  });
});

describe('argyle generate + solve', () => {
  it('should produce a uniquely solvable puzzle', () => {
    const model = buildModel(argyle);
    const { givens } = generate(model, 'advanced', seeded(40));

    expect(solve(model, givens, { max: 2 })).toHaveLength(1);
  });
});
