import { describe, expect, it } from 'vitest';
import { validate } from '@/engine/validate';
import { solve } from '@/engine/solve';
import { allVariants, NON_UNIQUE_VARIANTS } from './allVariants';
import { makeFixture } from './makeFixture';

describe('generation soundness', () => {
  it.each(allVariants())('should produce a complete, valid solution for $id', (variant) => {
    const { model, solution } = makeFixture(variant, 1);
    expect(solution.size).toBe(model.cells.length);
    expect(validate(solution, model)).toEqual([]);
  });

  it.each(allVariants().filter((v) => !NON_UNIQUE_VARIANTS.has(v.id)))(
    'should generate a uniquely solvable puzzle for $id',
    (variant) => {
      const { model, givens } = makeFixture(variant, 2);
      expect(solve(model, givens, { max: 2 })).toHaveLength(1);
    }
  );
});
