import { describe, expect, it } from 'vitest';
import { buildModel } from '@/engine/buildModel';
import { generate } from '@/engine/generate';
import { solve } from '@/engine/solve';
import { cross } from './cross';
import { getVariant } from './registry';

function seeded(seed: number): () => number {
  let state = seed;

  return () => {
    state = (state * 1103515245 + 12345) & 0x7fffffff;
    return state / 0x7fffffff;
  };
}

describe('cross variant - model structure', () => {
  const model = buildModel(cross);

  it('should have 297 cells', () => {
    expect(model.cells).toHaveLength(297);
  });

  it('should have 135 houses', () => {
    expect(model.houses).toHaveLength(135);
  });

  it('should have no duplicate house ids', () => {
    const ids = model.houses.map((house) => house.id);

    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe('cross variant - generate + solve', () => {
  it('should generate a uniquely solvable puzzle from the registry', () => {
    const model = buildModel(getVariant('cross'));
    const { givens } = generate(model, 'intermediate', seeded(42));

    expect(solve(model, givens, { max: 2 })).toHaveLength(1);
  });
});
