import { describe, expect, it } from 'vitest';
import { buildModel } from '@/engine/buildModel';
import { generate } from '@/engine/generate';
import { solve } from '@/engine/solve';
import { butterfly } from './butterfly';
import { getVariant } from './registry';
import { samurai } from './samurai';
import { sujiken } from './sujiken';

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

describe('geometry variants registry', () => {
  it('should resolve Samurai, Butterfly, and Sujiken by id', () => {
    expect(getVariant('samurai')).toBe(samurai);
    expect(getVariant('butterfly')).toBe(butterfly);
    expect(getVariant('sujiken')).toBe(sujiken);
  });
});
