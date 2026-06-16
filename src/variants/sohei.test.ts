import { describe, expect, it } from 'vitest';
import { buildModel } from '@/engine/buildModel';
import { generate } from '@/engine/generate';
import { solve } from '@/engine/solve';
import { sohei } from './sohei';
import { getVariant } from './registry';

function seeded(seed: number): () => number {
  let state = seed;

  return () => {
    state = (state * 1103515245 + 12345) & 0x7fffffff;
    return state / 0x7fffffff;
  };
}

describe('sohei variant - model structure', () => {
  const model = buildModel(sohei);

  it('should have 288 cells', () => {
    expect(model.cells).toHaveLength(288);
  });

  it('should have 108 houses', () => {
    expect(model.houses).toHaveLength(108);
  });

  it('should have no duplicate house ids', () => {
    const ids = model.houses.map((house) => house.id);

    expect(new Set(ids).size).toBe(ids.length);
  });

  it('should have 9 symbols', () => {
    expect(model.symbols).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9]);
  });
});

describe('sohei variant - generate + solve', () => {
  it(
    'should generate a uniquely solvable puzzle from the registry',
    { timeout: 120_000 },
    () => {
      const model = buildModel(getVariant('sohei'));
      const { givens } = generate(model, 'intermediate', seeded(42));

      expect(solve(model, givens, { max: 2 })).toHaveLength(1);
    }
  );
});
