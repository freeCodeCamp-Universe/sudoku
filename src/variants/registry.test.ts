import { describe, expect, it } from 'vitest';
import { buildModel } from '@/engine/buildModel';
import { generate } from '@/engine/generate';
import { solve } from '@/engine/solve';
import { arrow } from './arrow';
import { argyle } from './argyle';
import { asterisk } from './asterisk';
import { butterfly } from './butterfly';
import { color } from './color';
import { evenOdd } from './evenOdd';
import { jigsaw } from './jigsaw';
import { killer } from './killer';
import { mini } from './mini';
import { getVariant, variantRegistry } from './registry';
import { samurai } from './samurai';
import { skyscraper } from './skyscraper';
import { super16 } from './super16';
import { sujiken } from './sujiken';
import { sudokuX } from './sudoku-x';
import { windoku } from './windoku';
import { wordoku } from './wordoku';

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
    expect(getVariant('arrow')).toBe(arrow);
    expect(getVariant('asterisk')).toBe(asterisk);
    expect(getVariant('samurai')).toBe(samurai);
    expect(getVariant('butterfly')).toBe(butterfly);
    expect(getVariant('color')).toBe(color);
    expect(getVariant('even-odd')).toBe(evenOdd);
    expect(getVariant('jigsaw')).toBe(jigsaw);
    expect(getVariant('killer')).toBe(killer);
    expect(getVariant('mini')).toBe(mini);
    expect(getVariant('skyscraper')).toBe(skyscraper);
    expect(getVariant('sujiken')).toBe(sujiken);
    expect(getVariant('super')).toBe(super16);
    expect(getVariant('sudoku-x')).toBe(sudokuX);
    expect(getVariant('windoku')).toBe(windoku);
    expect(getVariant('wordoku')).toBe(wordoku);
  });

  it('should provide help data for every registered variant that needs it', () => {
    Object.values(variantRegistry)
      .filter((variant) => variant.help !== undefined)
      .forEach((variant) => {
        expect(variant.help!.length).toBeGreaterThan(0);
      });
  });
});
