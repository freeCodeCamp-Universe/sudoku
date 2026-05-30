import { describe, expect, it } from 'vitest';
import { buildModel } from '@/engine/buildModel';
import { generate } from '@/engine/generate';
import { solve } from '@/engine/solve';
import { getVariant } from './registry';

function seeded(seed: number): () => number {
  let state = seed;

  return () => {
    state = (state * 1103515245 + 12345) & 0x7fffffff;
    return state / 0x7fffffff;
  };
}

describe('classic variant end-to-end', () => {
  it('should generate a uniquely solvable puzzle from the registry', () => {
    const model = buildModel(getVariant('classic'));
    const { givens } = generate(model, 'intermediate', seeded(4));
    expect(solve(model, givens, { max: 2 })).toHaveLength(1);
  });

  it('should throw for an unknown variant id', () => {
    expect(() => getVariant('nope')).toThrow('Unknown variant: nope');
  });
});
