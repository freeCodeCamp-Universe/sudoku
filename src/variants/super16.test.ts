import { describe, expect, it } from 'vitest';
import { buildModel } from '@/engine/buildModel';
import { generate, multiplierForMode } from '@/engine/generate';
import { solve } from '@/engine/solve';
import { validate } from '@/engine/validate';
import { super16 } from './super16';

function seeded(seed: number): () => number {
  let state = seed;

  return () => {
    state = (state * 1103515245 + 12345) & 0x7fffffff;
    return state / 0x7fffffff;
  };
}

describe('super16 variant', () => {
  it('should have layout kind grid, size 16, box 4x4', () => {
    expect(super16.layout).toEqual({ kind: 'grid', size: 16, box: { rows: 4, cols: 4 } });
  });

  it('should use symbols 1..16', () => {
    expect(super16.symbols).toEqual(Array.from({ length: 16 }, (_, index) => index + 1));
  });

  it('should build a model with 256 cells and 48 houses', () => {
    const model = buildModel(super16);

    expect(model.cells).toHaveLength(256);
    expect(model.houses).toHaveLength(48);
  });

  it('should produce a conflict-free solution', () => {
    const model = buildModel(super16);
    const { solution } = generate(model, super16.difficulty, seeded(20));

    expect(validate(solution, model)).toEqual([]);
  });

  it('should map renderSymbol correctly for values 1-16', () => {
    expect(super16.renderSymbol?.(1)).toBe('1');
    expect(super16.renderSymbol?.(9)).toBe('9');
    expect(super16.renderSymbol?.(10)).toBe('A');
    expect(super16.renderSymbol?.(16)).toBe('G');
  });

  it('should generate a uniquely solvable puzzle', () => {
    const model = buildModel(super16);
    const { givens } = generate(model, super16.difficulty, seeded(21));

    expect(solve(model, givens, { max: 2 })).toHaveLength(1);
  }, 60_000);

  // A single greedy removal pass on this 256-cell grid plateaus around
  // 85-98 clues regardless of the requested target, which used to make every
  // Mode collapse to the same count (the generic ratio-derived target and the
  // old flat minimumClues floor both landed below that natural floor). Basing
  // the multiplier on this variant's own ~96 default instead gives Easy an
  // always-reachable increase and Expert a real, usually-reachable decrease.
  it('should leave more clues for easy than medium, and no more for expert than medium', () => {
    const model = buildModel(super16);
    const { givens: easy } = generate(
      model,
      super16.difficulty,
      seeded(22),
      multiplierForMode('easy')
    );
    const { givens: medium } = generate(
      model,
      super16.difficulty,
      seeded(22),
      multiplierForMode('medium')
    );
    const { givens: expert } = generate(
      model,
      super16.difficulty,
      seeded(22),
      multiplierForMode('expert')
    );

    expect(easy.size).toBeGreaterThan(medium.size);
    // Expert's lower target is not always reachable (removal only happens
    // once uniqueness is proven), so it is only guaranteed to be no denser
    // than medium, not strictly sparser on every seed.
    expect(expert.size).toBeLessThanOrEqual(medium.size);
  }, 30_000);
});
