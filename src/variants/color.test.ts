import { describe, expect, it } from 'vitest';
import { buildModel } from '@/engine/buildModel';
import { generate } from '@/engine/generate';
import { solve } from '@/engine/solve';
import { validate } from '@/engine/validate';
import { readThemeTokens } from '@/game/testing/themeTokens';
import { color } from './color';

function seeded(seed: number): () => number {
  let state = seed;

  return () => {
    state = (state * 1103515245 + 12345) & 0x7fffffff;
    return state / 0x7fffffff;
  };
}

describe('color variant', () => {
  it('should define the nine palette colors in theme.css', () => {
    const tokens = readThemeTokens();

    expect(tokens['--color-1'].dark).toBe('#e03535');
    expect(tokens['--color-9'].dark).toBe('#808098');
  });

  it('should have 9x9 grid layout', () => {
    expect(color.layout).toEqual({ kind: 'grid', size: 9, box: { rows: 3, cols: 3 } });
  });

  it('should use symbols 1..9', () => {
    expect(color.symbols).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9]);
  });

  it('should have symbolKind color', () => {
    expect(color.symbolKind).toBe('color');
  });

  it('should include the correct color names in order', () => {
    expect(color.colorNames).toEqual([
      'Red',
      'Orange',
      'Yellow',
      'Green',
      'Teal',
      'Blue',
      'Purple',
      'Lavender',
      'Silver',
    ]);
  });

  it('should generate a uniquely solvable puzzle', () => {
    const model = buildModel(color);
    const { givens } = generate(model, 'intermediate', seeded(40));

    expect(solve(model, givens, { max: 2 })).toHaveLength(1);
  });

  it('should produce no conflicts on the solution', () => {
    const model = buildModel(color);
    const { solution } = generate(model, 'intermediate', seeded(41));

    expect(validate(solution, model)).toEqual([]);
  });
});
