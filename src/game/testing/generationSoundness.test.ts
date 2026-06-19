import { describe, expect, it } from 'vitest';
import { validate } from '@/engine/validate';
import { solve } from '@/engine/solve';
import { buildModel } from '@/engine/buildModel';
import { generate } from '@/engine/generate';
import { allVariants, NON_UNIQUE_VARIANTS } from './allVariants';
import { makeFixture, seeded } from './makeFixture';

const SEEDS = [1, 2, 3, 4, 5];

describe('generation soundness', () => {
  it.each(allVariants())('should produce a complete, valid solution for $id', (variant) => {
    const { model, solution } = makeFixture(variant, 1);
    expect(solution.size).toBe(model.cells.length);
    expect(validate(solution, model)).toEqual([]);
  });

  it.each(allVariants())('should match its NON_UNIQUE_VARIANTS membership for $id', (variant) => {
    const model = buildModel(variant);
    const uniqueOnAllSeeds = SEEDS.every((s) => {
      const { givens } = generate(model, 'intermediate', seeded(s));
      return solve(model, givens, { max: 2 }).length === 1;
    });
    const shouldBeUnique = !NON_UNIQUE_VARIANTS.has(variant.id);

    expect(uniqueOnAllSeeds).toBe(shouldBeUnique);
  });
});
