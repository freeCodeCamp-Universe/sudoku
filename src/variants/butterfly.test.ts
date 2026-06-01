import { describe, expect, it } from 'vitest';
import { buildModel } from '@/engine/buildModel';
import { generate } from '@/engine/generate';
import { solve } from '@/engine/solve';
import { butterfly } from './butterfly';
import { getVariant } from './registry';

function seeded(seed: number): () => number {
  let state = seed;

  return () => {
    state = (state * 1103515245 + 12345) & 0x7fffffff;
    return state / 0x7fffffff;
  };
}

describe('butterfly variant - model structure', () => {
  const model = buildModel(butterfly);

  it('should have 144 cells', () => {
    expect(model.cells).toHaveLength(144);
  });

  it('should have 108 houses', () => {
    expect(model.houses).toHaveLength(108);
  });

  it('should have no duplicate house ids', () => {
    const ids = model.houses.map((house) => house.id);

    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe('butterfly variant - generate + solve', () => {
  it('should generate a uniquely solvable puzzle from the registry', () => {
    const model = buildModel(getVariant('butterfly'));
    const { givens } = generate(model, 'intermediate', seeded(20));

    expect(solve(model, givens, { max: 2 })).toHaveLength(1);
  });
});
