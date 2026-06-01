import { describe, expect, it } from 'vitest';
import { buildModel } from '@/engine/buildModel';
import { generate } from '@/engine/generate';
import { solve } from '@/engine/solve';
import { validate } from '@/engine/validate';
import { mini } from './mini';

function seeded(seed: number): () => number {
  let state = seed;

  return () => {
    state = (state * 1103515245 + 12345) & 0x7fffffff;
    return state / 0x7fffffff;
  };
}

describe('mini variant', () => {
  it('should have layout kind grid, size 4, box 2x2', () => {
    expect(mini.layout).toEqual({ kind: 'grid', size: 4, box: { rows: 2, cols: 2 } });
  });

  it('should use symbols 1..4', () => {
    expect(mini.symbols).toEqual([1, 2, 3, 4]);
  });

  it('should build a model with 16 cells and 12 houses', () => {
    const model = buildModel(mini);

    expect(model.cells).toHaveLength(16);
    expect(model.houses).toHaveLength(12);
  });

  it('should generate a uniquely solvable 4x4 puzzle', () => {
    const model = buildModel(mini);
    const { givens } = generate(model, 'intermediate', seeded(10));

    expect(solve(model, givens, { max: 2 })).toHaveLength(1);
  });

  it('should produce no conflicts on the solution', () => {
    const model = buildModel(mini);
    const { solution } = generate(model, 'intermediate', seeded(11));

    expect(validate(solution, model)).toEqual([]);
  });
});
