import { describe, expect, it } from 'vitest';
import { buildModel } from '@/engine/buildModel';
import { generate, generateSolution } from '@/engine/generate';
import { solve } from '@/engine/solve';
import type { VariantModel } from '@/engine/types';
import { validate } from '@/engine/validate';
import type { Arrow } from '@/game/gameTypes';
import { arrow } from './arrow';

function seeded(seed: number): () => number {
  let state = seed;

  return () => {
    state = (state * 1103515245 + 12345) & 0x7fffffff;
    return state / 0x7fffffff;
  };
}

describe('arrow variant', () => {
  it('should have 9x9 grid layout', () => {
    expect(arrow.layout).toEqual({ kind: 'grid', size: 9, box: { rows: 3, cols: 3 } });
  });

  it('should include uniqueness and arrowSum constraint ids', () => {
    expect(arrow.constraintIds).toContain('uniqueness');
    expect(arrow.constraintIds).toContain('arrowSum');
  });

  it('should include arrow overlay id', () => {
    expect(arrow.overlayIds).toContain('arrow');
  });

  it('should include arrow-bulb and arrow-path annotator ids', () => {
    expect(arrow.annotatorIds).toContain('arrow-bulb');
    expect(arrow.annotatorIds).toContain('arrow-path');
  });

  it('should derive structure with at least 1 arrow', () => {
    const model = buildModel(arrow);
    const solution = generateSolution(model, seeded(70));
    const structure = arrow.deriveStructure?.(solution, model) as { arrows: Arrow[] };

    expect(structure.arrows.length).toBeGreaterThanOrEqual(1);
  });

  it('should derive arrows where bulb value equals path sum', () => {
    const model = buildModel(arrow);
    const solution = generateSolution(model, seeded(71));
    const structure = arrow.deriveStructure?.(solution, model) as { arrows: Arrow[] };

    for (const { bulb, path } of structure.arrows) {
      const bulbValue = solution.get(bulb) ?? 0;
      const pathSum = path.reduce((sum, cellId) => sum + (solution.get(cellId) ?? 0), 0);

      expect(pathSum).toBe(bulbValue);
    }
  });

  it('should detect an arrow sum violation via validate', () => {
    const model = buildModel(arrow);
    const solution = generateSolution(model, seeded(72));
    const structure = arrow.deriveStructure?.(solution, model) as { arrows: Arrow[] };
    const modelWithStructure: VariantModel = { ...model, structure };
    const firstArrow = structure.arrows[0];
    const brokenValues = new Map(solution);
    const bulbValue = solution.get(firstArrow.bulb) ?? 0;

    brokenValues.set(firstArrow.bulb, bulbValue === 9 ? 1 : bulbValue + 1);

    const conflicts = validate(brokenValues, modelWithStructure);
    expect(conflicts.some((conflict) => conflict.constraintId === 'arrowSum')).toBe(true);
  });

  it('should generate a uniquely solvable puzzle', () => {
    const model = buildModel(arrow);
    const { givens, solution } = generate(model, 'intermediate', seeded(73));
    const structure = arrow.deriveStructure?.(solution, model);
    const modelWithStructure: VariantModel = { ...model, structure };

    expect(solve(modelWithStructure, givens, { max: 2 })).toHaveLength(1);
  });
});
