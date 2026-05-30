import { describe, expect, it } from 'vitest';
import { buildModel } from '@/engine/buildModel';
import { generate } from '@/engine/generate';
import { solve } from '@/engine/solve';
import { argyle } from './argyle';
import { asterisk } from './asterisk';
import { butterfly } from './butterfly';
import { jigsaw } from './jigsaw';
import { getVariant } from './registry';
import { samurai } from './samurai';
import { sujiken } from './sujiken';
import { sudokuX } from './sudoku-x';
import { windoku } from './windoku';

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
  it('should resolve all registered region and geometry variants by id', () => {
    expect(getVariant('argyle')).toBe(argyle);
    expect(getVariant('asterisk')).toBe(asterisk);
    expect(getVariant('samurai')).toBe(samurai);
    expect(getVariant('butterfly')).toBe(butterfly);
    expect(getVariant('jigsaw')).toBe(jigsaw);
    expect(getVariant('sujiken')).toBe(sujiken);
    expect(getVariant('sudoku-x')).toBe(sudokuX);
    expect(getVariant('windoku')).toBe(windoku);
  });
});
