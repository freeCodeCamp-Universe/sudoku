import { describe, expect, it } from 'vitest';
import { uniqueness } from './constraints/uniqueness';
import { generate, generateSolution, cluesFor } from './generate';
import { gridCells, standardHouses } from './grid';
import { solve } from './solve';
import type { VariantModel } from './types';

const model: VariantModel = {
  cells: gridCells(9),
  houses: standardHouses(9, { rows: 3, cols: 3 }),
  constraints: [uniqueness],
  symbols: [1, 2, 3, 4, 5, 6, 7, 8, 9],
};

function seeded(seed: number): () => number {
  let state = seed;

  return () => {
    state = (state * 1103515245 + 12345) & 0x7fffffff;
    return state / 0x7fffffff;
  };
}

describe('generateSolution', () => {
  it('should produce a fully filled, conflict-free grid', () => {
    const solution = generateSolution(model, seeded(1));
    expect(solution.size).toBe(81);
    expect(uniqueness.conflicts(solution, model)).toEqual([]);
  });
});

describe('generate', () => {
  it('should produce givens with exactly one solution', () => {
    const { givens } = generate(model, 'intermediate', seeded(2));
    expect(solve(model, givens, { max: 2 })).toHaveLength(1);
  });

  it('should leave roughly the clue count for the difficulty', () => {
    const { givens } = generate(model, 'beginner', seeded(3));
    expect(givens.size).toBeGreaterThanOrEqual(cluesFor('beginner', 81));
  });
});
