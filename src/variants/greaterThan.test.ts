import { describe, expect, it } from 'vitest';
import { buildModel } from '@/engine/buildModel';
import { generate } from '@/engine/generate';
import { solve } from '@/engine/solve';
import { validate } from '@/engine/validate';
import type { Relation } from '@/engine/constraints/greaterThan';
import { greaterThanVariant } from './greaterThan';

function seeded(seed: number): () => number {
  let state = seed;

  return () => {
    state = (state * 1103515245 + 12345) & 0x7fffffff;
    return state / 0x7fffffff;
  };
}

describe('greaterThanVariant', () => {
  it('should have the correct id, layout, and constraint ids', () => {
    expect(greaterThanVariant.id).toBe('greater-than');
    expect(greaterThanVariant.layout).toEqual({ kind: 'grid', size: 9, box: { rows: 3, cols: 3 } });
    expect(greaterThanVariant.constraintIds).toContain('uniqueness');
    expect(greaterThanVariant.constraintIds).toContain('greaterThan');
  });

  it('should derive relations from the solution covering all adjacent pairs', () => {
    const model = buildModel(greaterThanVariant);
    const { solution } = generate(model, 'intermediate', seeded(10));
    const structure = greaterThanVariant.deriveStructure?.(solution, model) as {
      relations: Relation[];
    };

    expect(structure.relations).toHaveLength(144);
  });

  it('should derive relations where the greater cell truly has a higher value', () => {
    const model = buildModel(greaterThanVariant);
    const { solution } = generate(model, 'intermediate', seeded(11));
    const structure = greaterThanVariant.deriveStructure?.(solution, model) as {
      relations: Relation[];
    };

    for (const { greater, lesser } of structure.relations) {
      expect(solution.get(greater)).toBeGreaterThan(solution.get(lesser) ?? 0);
    }
  });

  it('should generate a uniquely solvable puzzle when structure is merged into the model', () => {
    const model = buildModel(greaterThanVariant);
    const { solution, givens } = generate(model, 'intermediate', seeded(12));
    const structure = greaterThanVariant.deriveStructure?.(solution, model);
    const modelWithStructure = { ...model, structure };

    expect(solve(modelWithStructure, givens, { max: 2 })).toHaveLength(1);
  });

  it('should detect a known violation via validate', () => {
    const model = buildModel(greaterThanVariant);
    const { solution } = generate(model, 'intermediate', seeded(13));
    const structure = greaterThanVariant.deriveStructure?.(solution, model) as {
      relations: Relation[];
    };
    const relation = structure.relations[0];
    const brokenValues = new Map(solution);
    const greaterValue = solution.get(relation.greater);
    const lesserValue = solution.get(relation.lesser);
    const modelWithStructure = { ...model, structure };

    brokenValues.set(relation.greater, lesserValue ?? 0);
    brokenValues.set(relation.lesser, greaterValue ?? 0);

    expect(
      validate(brokenValues, modelWithStructure).some(
        (conflict) => conflict.constraintId === 'greaterThan'
      )
    ).toBe(true);
  });
});
