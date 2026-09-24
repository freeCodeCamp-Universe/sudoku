import { describe, expect, it } from 'vitest';
import { buildModel } from '@/engine/buildModel';
import { cellId } from '@/engine/grid';
import { getVariant } from '@/variants/registry';
import { puzzleFromConfig } from './puzzleFromConfig';

describe('puzzleFromConfig', () => {
  it('should build a classic puzzle from its givens and solution', () => {
    const variant = getVariant('classic');
    const givens = new Map([
      [cellId(0, 0), 1],
      [cellId(8, 8), 9],
    ]);
    const solution = new Map([[cellId(0, 0), 1]]);

    const puzzle = puzzleFromConfig(variant, givens, solution);

    expect(puzzle.model).toEqual(buildModel(variant));
    expect(puzzle.givens).toBe(givens);
    expect(puzzle.solution).toBe(solution);
  });
});
