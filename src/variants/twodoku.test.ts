import { describe, expect, it } from 'vitest';
import { buildModel } from '@/engine/buildModel';
import { generate } from '@/engine/generate';
import { solve } from '@/engine/solve';
import { twodoku } from './twodoku';
import { getVariant } from './registry';

function seeded(seed: number): () => number {
  let state = seed;

  return () => {
    state = (state * 1103515245 + 12345) & 0x7fffffff;
    return state / 0x7fffffff;
  };
}

describe('twodoku variant - model structure', () => {
  const model = buildModel(twodoku);

  it('should have 153 cells', () => {
    expect(model.cells).toHaveLength(153);
  });

  it('should have 54 houses', () => {
    expect(model.houses).toHaveLength(54);
  });

  it('should have no duplicate house ids', () => {
    const ids = model.houses.map((house) => house.id);

    expect(new Set(ids).size).toBe(ids.length);
  });

  it('should have 9 symbols', () => {
    expect(model.symbols).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9]);
  });
});

describe('twodoku variant - generate + solve', () => {
  it('should generate a uniquely solvable puzzle from the registry', { timeout: 60_000 }, () => {
    const model = buildModel(getVariant('twodoku'));
    const { givens } = generate(model, 'intermediate', seeded(42));

    expect(solve(model, givens, { max: 2 })).toHaveLength(1);
  });
});
