import { describe, expect, it } from 'vitest';
import { sudokuX } from '@/variants/sudoku-x';
import { evenOdd } from '@/variants/evenOdd';
import { makeFixture } from './makeFixture';

describe('makeFixture', () => {
  it('should return a complete, valid solution for the variant', () => {
    const { solution, model } = makeFixture(sudokuX);
    expect(solution.size).toBe(model.cells.length);
  });

  it('should be deterministic for the same seed', () => {
    const a = makeFixture(sudokuX, 7);
    const b = makeFixture(sudokuX, 7);
    expect([...a.solution.entries()]).toEqual([...b.solution.entries()]);
  });

  it('should expose a parityMap for value-derived variants', () => {
    const { parityMap } = makeFixture(evenOdd, 11);
    expect(parityMap?.size).toBeGreaterThan(0);
  });
});
