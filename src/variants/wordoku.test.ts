import { describe, expect, it } from 'vitest';
import { buildModel } from '@/engine/buildModel';
import { generate } from '@/engine/generate';
import { solve } from '@/engine/solve';
import { validate } from '@/engine/validate';
import { wordoku, WORDS } from './wordoku';

function seeded(seed: number): () => number {
  let state = seed;

  return () => {
    state = (state * 1103515245 + 12345) & 0x7fffffff;
    return state / 0x7fffffff;
  };
}

describe('wordoku variant', () => {
  it('should have 9x9 grid layout', () => {
    expect(wordoku.layout).toEqual({ kind: 'grid', size: 9, box: { rows: 3, cols: 3 } });
  });

  it('should use symbols 1..9', () => {
    expect(wordoku.symbols).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9]);
  });

  it('should have symbolKind letter', () => {
    expect(wordoku.symbolKind).toBe('letter');
  });

  it('should export a non-empty WORDS array of 9-character strings with unique letters', () => {
    expect(WORDS.length).toBeGreaterThan(0);

    for (const word of WORDS) {
      expect(word).toHaveLength(9);
      expect(new Set(word.split('')).size).toBe(9);
    }
  });

  it('should derive structure containing a word from WORDS', () => {
    const model = buildModel(wordoku);
    const { solution } = generate(model, 'intermediate', seeded(30));
    const structure = wordoku.deriveStructure?.(solution, model) as { word: string };

    expect(WORDS).toContain(structure.word);
  });

  it('should use a configured word when building lesson structure', () => {
    const model = buildModel(wordoku);
    const { solution } = generate(model, 'intermediate', seeded(33));

    expect(wordoku.lessonStructure?.({ word: 'ABCDEFGHI' }, solution, model)).toEqual({
      word: 'ABCDEFGHI',
    });
  });

  it.each([
    ['missing word', {}, 'structure must contain only a word field'],
    ['word with wrong length', { word: 'TOOSHORT' }, 'word must be 9 uppercase letters A-Z'],
    ['lowercase word', { word: 'abcdefghi' }, 'word must be 9 uppercase letters A-Z'],
    ['repeated letters', { word: 'AAAAAAAAA' }, 'word must not contain repeated letters'],
    ['extra keys', { word: 'ABCDEFGHI', other: true }, 'structure must contain only a word field'],
  ])('should reject lesson structure with %s', (_name, raw, message) => {
    const model = buildModel(wordoku);
    const { solution } = generate(model, 'intermediate', seeded(34));

    expect(() => wordoku.lessonStructure?.(raw, solution, model)).toThrow(message);
  });

  it('should reject a configured word when no solution line reads 1-9', () => {
    const model = buildModel(wordoku);
    const { solution } = generate(model, 'intermediate', seeded(35));
    const shiftedSolution = new Map([...solution].map(([id, value]) => [id, (value % 9) + 1]));

    expect(() => wordoku.lessonStructure?.({ word: 'ABCDEFGHI' }, shiftedSolution, model)).toThrow(
      'word must match a row or column of the solution that reads 1-9'
    );
  });

  it('should render letters from the derived word structure', () => {
    expect(wordoku.renderSymbol?.(1, { word: 'WONDERFUL' })).toBe('W');
    expect(wordoku.renderSymbol?.(9, { word: 'WONDERFUL' })).toBe('L');
  });

  it('should generate a uniquely solvable puzzle', () => {
    const model = buildModel(wordoku);
    const { givens } = generate(model, 'intermediate', seeded(31));

    expect(solve(model, givens, { max: 2 })).toHaveLength(1);
  });

  it('should produce no conflicts on the solution', () => {
    const model = buildModel(wordoku);
    const { solution } = generate(model, 'intermediate', seeded(32));

    expect(validate(solution, model)).toEqual([]);
  });
});
