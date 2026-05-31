import { describe, expect, it } from 'vitest';
import type { Values } from '@/engine/types';
import { findCompletedSymbols } from './completedSymbols';

describe('findCompletedSymbols', () => {
  it('should disable a symbol after nine placements on a 9x9 board', () => {
    const values: Values = new Map(
      Array.from({ length: 9 }, (_, index) => [`r${index}c0`, 7] as const)
    );

    expect(findCompletedSymbols(values, [1, 2, 3, 4, 5, 6, 7, 8, 9], 81)).toEqual(new Set([7]));
  });

  it('should keep samurai symbols enabled until forty-one placements', () => {
    const values: Values = new Map(
      Array.from({ length: 40 }, (_, index) => [`r${index}c0`, 7] as const)
    );

    expect(findCompletedSymbols(values, [1, 2, 3, 4, 5, 6, 7, 8, 9], 369)).toEqual(new Set());
  });

  it('should disable a samurai symbol after forty-one placements', () => {
    const values: Values = new Map(
      Array.from({ length: 41 }, (_, index) => [`r${index}c0`, 7] as const)
    );

    expect(findCompletedSymbols(values, [1, 2, 3, 4, 5, 6, 7, 8, 9], 369)).toEqual(new Set([7]));
  });
});
