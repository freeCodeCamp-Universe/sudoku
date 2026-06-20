import { describe, expect, it } from 'vitest';
import type { Values, VariantModel } from '@/engine/types';
import { buildModel } from '@/engine/buildModel';
import { validate } from '@/engine/validate';
import { allVariants, houseCellIds } from './allVariants';
import { makeFixture } from './makeFixture';

function hasUniqueness(model: VariantModel): boolean {
  return model.constraints.some((c) => c.id === 'uniqueness');
}

const variantsWithUniqueness = allVariants().filter((v) => hasUniqueness(buildModel(v)));

describe('uniqueness conflict detection', () => {
  it.each(allVariants())('should report no conflict on the $id solution', (variant) => {
    const { model, solution } = makeFixture(variant, 3);

    expect(validate(solution, model)).toEqual([]);
  });

  it.each(allVariants())('should declare the uniqueness constraint on $id', (variant) => {
    // Every current variant enforces no-duplicate-in-house at play time. If a
    // future variant intentionally omits it, this assertion goes red on purpose:
    // gate the duplicate test below for that variant and document the omission
    // here rather than deleting this assertion.
    expect(hasUniqueness(buildModel(variant))).toBe(true);
  });

  it.each(variantsWithUniqueness)('should flag a duplicate within a house on $id', (variant) => {
    const { model, solution } = makeFixture(variant, 3);
    const house = model.houses.find((h) => houseCellIds(h).length >= 2);

    if (!house) {
      throw new Error(`No multi-cell house for ${variant.id}`);
    }

    const [a, b] = houseCellIds(house);
    const bad: Values = new Map(solution);
    bad.set(b, solution.get(a)!); // force a duplicate of a's value into the same house

    const conflicts = validate(bad, model);

    expect(conflicts.some((c) => c.constraintId === 'uniqueness')).toBe(true);
  });
});
