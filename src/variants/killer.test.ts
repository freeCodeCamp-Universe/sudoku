import { describe, expect, it } from 'vitest';
import { buildModel } from '@/engine/buildModel';
import { generate, generateSolution } from '@/engine/generate';
import type { VariantModel } from '@/engine/types';
import { validate } from '@/engine/validate';
import type { Cage } from '@/game/gameTypes';
import { killer } from './killer';

function seeded(seed: number): () => number {
  let state = seed;

  return () => {
    state = (state * 1103515245 + 12345) & 0x7fffffff;
    return state / 0x7fffffff;
  };
}

describe('killer variant', () => {
  it('should have 9x9 grid layout', () => {
    expect(killer.layout).toEqual({
      kind: 'grid',
      size: 9,
      box: { rows: 3, cols: 3 },
      cellSize: 'spacious',
    });
  });

  it('should include uniqueness and cageSum constraint ids', () => {
    expect(killer.constraintIds).toContain('uniqueness');
    expect(killer.constraintIds).toContain('cageSum');
  });

  it('should include cage overlay id', () => {
    expect(killer.overlayIds).toContain('cage');
  });

  it('should include cage-sum annotator id', () => {
    expect(killer.annotatorIds).toContain('cage-sum');
  });

  it('should derive structure with cages covering all 81 cells', () => {
    const model = buildModel(killer);
    const solution = generateSolution(model, seeded(60));
    const structure = killer.deriveStructure?.(solution, model) as { cages: Cage[] };
    const covered = new Set(structure.cages.flatMap((cage) => cage.cells));

    expect(covered.size).toBe(81);
  });

  it('should derive cages with size 2-4', () => {
    const model = buildModel(killer);
    const solution = generateSolution(model, seeded(61));
    const structure = killer.deriveStructure?.(solution, model) as { cages: Cage[] };

    for (const cage of structure.cages) {
      expect(cage.cells.length).toBeGreaterThanOrEqual(2);
      expect(cage.cells.length).toBeLessThanOrEqual(4);
    }
  });

  it('should derive cages where each cage sum matches the sum of cell values', () => {
    const model = buildModel(killer);
    const solution = generateSolution(model, seeded(62));
    const structure = killer.deriveStructure?.(solution, model) as { cages: Cage[] };

    for (const cage of structure.cages) {
      const total = cage.cells.reduce((sum, cellId) => sum + (solution.get(cellId) ?? 0), 0);
      expect(cage.sum).toBe(total);
    }
  });

  it('should detect a cage sum violation via validate', () => {
    const model = buildModel(killer);
    const solution = generateSolution(model, seeded(63));
    const structure = killer.deriveStructure?.(solution, model) as { cages: Cage[] };
    const modelWithStructure: VariantModel = { ...model, structure };
    const brokenValues = new Map(solution);
    const firstCage = structure.cages[0];

    firstCage.cells.forEach((cellId) => brokenValues.set(cellId, 1));

    const conflicts = validate(brokenValues, modelWithStructure);
    expect(conflicts.some((conflict) => conflict.constraintId === 'cageSum')).toBe(true);
  });

  it('should generate a solution valid under cageSum', () => {
    const model = buildModel(killer);
    const solution = generateSolution(model, seeded(64));
    const structure = killer.deriveStructure?.(solution, model) as { cages: Cage[] };
    const modelWithStructure: VariantModel = { ...model, structure };

    expect(validate(solution, modelWithStructure)).toEqual([]);
  });

  it('should generate starting-clue givens that match the solution', () => {
    const model = buildModel(killer);
    const { givens, solution } = generate(model, killer.difficulty, seeded(65));

    expect(givens.size).toBeGreaterThan(0);
    expect(givens.size).toBeLessThan(81);
    // 15 is the configured target floor for shared 9x9 givens generation, not a cap.
    expect(givens.size).toBeGreaterThanOrEqual(15);

    for (const [cellId, value] of givens) {
      expect(value).toBe(solution.get(cellId));
    }
  });
});
