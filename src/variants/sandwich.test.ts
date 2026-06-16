import { describe, expect, it } from 'vitest';
import { buildModel } from '@/engine/buildModel';
import { generate } from '@/engine/generate';
import { sandwich } from './sandwich';
import { getVariant } from './registry';

function seeded(seed: number): () => number {
  let state = seed;

  return () => {
    state = (state * 1103515245 + 12345) & 0x7fffffff;
    return state / 0x7fffffff;
  };
}

describe('sandwich variant - model structure', () => {
  const model = buildModel(sandwich);

  it('should have 81 cells', () => {
    expect(model.cells).toHaveLength(81);
  });

  it('should have 27 houses', () => {
    expect(model.houses).toHaveLength(27);
  });

  it('should have no duplicate house ids', () => {
    const ids = model.houses.map((house) => house.id);

    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe('sandwich variant - generate + solve', () => {
  it('should generate a puzzle with givens from the registry', () => {
    const model = buildModel(getVariant('sandwich'));
    const { givens } = generate(model, 'intermediate', seeded(42));

    expect(givens.size).toBeGreaterThan(0);
  });
});
