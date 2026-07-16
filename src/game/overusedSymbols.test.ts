import { describe, expect, it } from 'vitest';
import { findOverusedSymbols } from './overusedSymbols';

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

describe('findOverusedSymbols', () => {
  it('should return an empty set when no symbol is overused', () => {
    const solution = makeSolution({ 1: 9, 2: 9, 3: 9, 4: 9, 5: 9, 6: 9, 7: 9, 8: 9, 9: 9 });
    const values = new Map([['r0c0', 1]] as [string, number][]);
    const result = findOverusedSymbols(values as never, solution as never, SYMBOLS);

    expect(result.size).toBe(0);
  });

  it('should not flag a symbol that is exactly fully placed', () => {
    const solution = makeSolution({ 1: 9, 2: 9, 3: 9, 4: 9, 5: 9, 6: 9, 7: 9, 8: 9, 9: 9 });
    const values = new Map(Array.from({ length: 9 }, (_, i) => [`r${i}c0`, 5] as [string, number]));
    const result = findOverusedSymbols(values as never, solution as never, SYMBOLS);

    expect(result.size).toBe(0);
  });

  it('should flag a symbol when placed count exceeds solution count', () => {
    const solution = makeSolution({ 1: 1, 2: 9, 3: 9, 4: 9, 5: 9, 6: 9, 7: 9, 8: 9, 9: 9 });
    const values = new Map([
      ['r0c0', 1],
      ['r0c1', 1],
    ]);
    const result = findOverusedSymbols(values as never, solution as never, SYMBOLS);

    expect(result.has(1)).toBe(true);
    expect(result.size).toBe(1);
  });

  it('should not flag a symbol that is absent from the solution', () => {
    // The solution has no 5s, so there is no known requirement to exceed.
    const solution = makeSolution({ 1: 9, 2: 9, 3: 9, 4: 9, 6: 9, 7: 9, 8: 9, 9: 9 });
    const values = new Map([
      ['r0c0', 5],
      ['r0c1', 5],
    ]);
    const result = findOverusedSymbols(values as never, solution as never, SYMBOLS);

    expect(result.has(5)).toBe(false);
    expect(result.size).toBe(0);
  });

  it('should use per-symbol solution counts, not a uniform average', () => {
    // Symbol 8 appears 4 times in the solution; placing it 5 times overuses it.
    // Symbol 1 appears 6 times but is only placed 5 times, so it is not overused.
    const solution = makeSolution({ 1: 6, 2: 5, 3: 5, 4: 5, 5: 5, 6: 5, 7: 5, 8: 4, 9: 5 });
    const values = new Map([
      ...Array.from({ length: 5 }, (_, i) => [`r${i}c0`, 8] as [string, number]),
      ...Array.from({ length: 5 }, (_, i) => [`r${i}c1`, 1] as [string, number]),
    ]);
    const result = findOverusedSymbols(values as never, solution as never, SYMBOLS);

    expect(result.has(8)).toBe(true);
    expect(result.has(1)).toBe(false);
    expect(result.size).toBe(1);
  });
});
