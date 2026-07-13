import { describe, expect, it } from 'vitest';
import { findCompletedSymbols } from './completedSymbols';

describe('findCompletedSymbols', () => {
  it('should return an empty set when no symbols are fully placed', () => {
    const values = new Map([['r0c0', 1]] as [string, number][]);
    const result = findCompletedSymbols(values as never, [1, 2, 3, 4, 5, 6, 7, 8, 9], 81);

    expect(result.size).toBe(0);
  });

  it('should mark a symbol as complete when it reaches the required count', () => {
    const values = new Map(Array.from({ length: 9 }, (_, i) => [`r${i}c0`, 5] as [string, number]));
    const result = findCompletedSymbols(values as never, [1, 2, 3, 4, 5, 6, 7, 8, 9], 81);

    expect(result.has(5)).toBe(true);
    expect(result.size).toBe(1);
  });

  it('should compute requiredCount as ceil(totalCells / symbols.length)', () => {
    // 6x6 grid: ceil(36/6) = 6 required per symbol
    const values = new Map(Array.from({ length: 6 }, (_, i) => [`r${i}c0`, 3] as [string, number]));
    const result = findCompletedSymbols(values as never, [1, 2, 3, 4, 5, 6], 36);

    expect(result.has(3)).toBe(true);
  });
});
