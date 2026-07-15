import { describe, expect, it } from 'vitest';
import { findCompletedSymbols } from './completedSymbols';

const SYMBOLS = [1, 2, 3, 4, 5, 6, 7, 8, 9];

function makeSolution(counts: Partial<Record<number, number>>): Map<string, number> {
  const solution = new Map<string, number>();
  let id = 0;
  for (const [symbol, count] of Object.entries(counts)) {
    for (let i = 0; i < Number(count); i += 1) {
      solution.set(`cell${id++}`, Number(symbol));
    }
  }
  return solution;
}

describe('findCompletedSymbols', () => {
  it('should return an empty set when no symbols are fully placed', () => {
    const solution = makeSolution({ 1: 9, 2: 9, 3: 9, 4: 9, 5: 9, 6: 9, 7: 9, 8: 9, 9: 9 });
    const values = new Map([['r0c0', 1]] as [string, number][]);
    const result = findCompletedSymbols(values as never, solution as never, SYMBOLS);

    expect(result.size).toBe(0);
  });

  it('should mark a symbol as complete when placed count equals solution count', () => {
    const solution = makeSolution({ 1: 9, 2: 9, 3: 9, 4: 9, 5: 9, 6: 9, 7: 9, 8: 9, 9: 9 });
    const values = new Map(Array.from({ length: 9 }, (_, i) => [`r${i}c0`, 5] as [string, number]));
    const result = findCompletedSymbols(values as never, solution as never, SYMBOLS);

    expect(result.has(5)).toBe(true);
    expect(result.size).toBe(1);
  });

  it('should use per-symbol solution counts, not a uniform average', () => {
    // Symbol 8 appears 4 times in the solution, symbol 1 appears 6 times.
    // Only symbol 8 is fully placed.
    const solution = makeSolution({ 1: 6, 2: 5, 3: 5, 4: 5, 5: 5, 6: 5, 7: 5, 8: 4, 9: 5 });
    const values = new Map(Array.from({ length: 4 }, (_, i) => [`r${i}c0`, 8] as [string, number]));
    const result = findCompletedSymbols(values as never, solution as never, SYMBOLS);

    expect(result.has(8)).toBe(true);
    expect(result.has(1)).toBe(false);
    expect(result.size).toBe(1);
  });
});
