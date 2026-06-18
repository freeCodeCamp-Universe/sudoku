import { describe, expect, it } from 'vitest';
import { buildModel } from '@/engine/buildModel';
import { generate, generateSolution } from '@/engine/generate';
import { solve } from '@/engine/solve';
import type { VariantModel } from '@/engine/types';
import { validate } from '@/engine/validate';
import type { EdgeClues } from '@/game/gameTypes';
import { buildGutters, skyscraper } from './skyscraper';

function seeded(seed: number): () => number {
  let state = seed;

  return () => {
    state = (state * 1103515245 + 12345) & 0x7fffffff;
    return state / 0x7fffffff;
  };
}

describe('skyscraper variant', () => {
  it('should have 9x9 grid layout', () => {
    expect(skyscraper.layout).toEqual({ kind: 'grid', size: 9, box: { rows: 3, cols: 3 } });
  });

  it('should include uniqueness and skyscraperVisibility constraint ids', () => {
    expect(skyscraper.constraintIds).toContain('uniqueness');
    expect(skyscraper.constraintIds).toContain('skyscraperVisibility');
  });

  it('should have no overlay ids (uses gutters instead)', () => {
    expect(skyscraper.overlayIds ?? []).toHaveLength(0);
  });

  it('should include skyscraper-clue annotator id', () => {
    expect(skyscraper.annotatorIds).toContain('skyscraper-clue');
  });

  it('should derive clues with correct shape (4 arrays of length 9)', () => {
    const model = buildModel(skyscraper);
    const solution = generateSolution(model, seeded(80));
    const structure = skyscraper.deriveStructure?.(solution, model) as { clues: EdgeClues };

    expect(structure.clues.top).toHaveLength(9);
    expect(structure.clues.bottom).toHaveLength(9);
    expect(structure.clues.start).toHaveLength(9);
    expect(structure.clues.end).toHaveLength(9);
  });

  it('should derive valid clues: all values in 1..9', () => {
    const model = buildModel(skyscraper);
    const solution = generateSolution(model, seeded(81));
    const structure = skyscraper.deriveStructure?.(solution, model) as { clues: EdgeClues };
    const allClues = [
      ...structure.clues.top,
      ...structure.clues.bottom,
      ...structure.clues.start,
      ...structure.clues.end,
    ];

    for (const value of allClues) {
      expect(value).toBeGreaterThanOrEqual(1);
      expect(value).toBeLessThanOrEqual(9);
    }
  });

  it('should produce no conflicts on a solution with correct structure', () => {
    const model = buildModel(skyscraper);
    const solution = generateSolution(model, seeded(82));
    const structure = skyscraper.deriveStructure?.(solution, model);
    const modelWithStructure: VariantModel = { ...model, structure };

    expect(validate(solution, modelWithStructure)).toEqual([]);
  });

  it('should detect a visibility violation via validate', () => {
    const model = buildModel(skyscraper);
    const solution = generateSolution(model, seeded(83));
    const structure = skyscraper.deriveStructure?.(solution, model) as { clues: EdgeClues };
    const wrongClues: EdgeClues = {
      ...structure.clues,
      top: structure.clues.top.map((value, index) => (index === 0 ? (value === 9 ? 1 : 9) : value)),
    };
    const modelWithStructure: VariantModel = {
      ...model,
      structure: { clues: wrongClues },
    };

    const conflicts = validate(solution, modelWithStructure);
    expect(conflicts.some((conflict) => conflict.constraintId === 'skyscraperVisibility')).toBe(
      true
    );
  });

  it('should generate a uniquely solvable puzzle', () => {
    const model = buildModel(skyscraper);
    const { givens, solution } = generate(model, 'intermediate', seeded(84));
    const structure = skyscraper.deriveStructure?.(solution, model);
    const modelWithStructure: VariantModel = { ...model, structure };

    expect(solve(modelWithStructure, givens, { max: 2 })).toHaveLength(1);
  }, 30_000);
});

describe('buildGutters', () => {
  it('should produce GutterSlots with top/bottom/start/end each having 9 cells', () => {
    const clues: EdgeClues = {
      top: [1, 2, 3, 4, 5, 6, 7, 8, 9],
      bottom: [9, 8, 7, 6, 5, 4, 3, 2, 1],
      start: [2, 3, 4, 5, 6, 7, 8, 9, 1],
      end: [8, 7, 6, 5, 4, 3, 2, 1, 9],
    };
    const gutters = buildGutters(clues);

    expect(gutters.top).toHaveLength(9);
    expect(gutters.bottom).toHaveLength(9);
    expect(gutters.start).toHaveLength(9);
    expect(gutters.end).toHaveLength(9);
  });

  it('should set each gutter cell label to the string form of the clue value', () => {
    const clues: EdgeClues = {
      top: [3, 0, 0, 0, 0, 0, 0, 0, 0],
      bottom: [0, 0, 0, 0, 0, 0, 0, 0, 0],
      start: [5, 0, 0, 0, 0, 0, 0, 0, 0],
      end: [0, 0, 0, 0, 0, 0, 0, 0, 0],
    };
    const gutters = buildGutters(clues);

    expect(gutters.top?.[0]?.label).toBe('3');
    expect(gutters.start?.[0]?.label).toBe('5');
  });

  it('should set a descriptive aria description explaining the visibility count', () => {
    const clues: EdgeClues = {
      top: [3, 0, 0, 0, 0, 0, 0, 0, 0],
      bottom: [0, 0, 0, 0, 0, 0, 0, 0, 0],
      start: [1, 0, 0, 0, 0, 0, 0, 0, 0],
      end: [0, 0, 0, 0, 0, 0, 0, 0, 0],
    };
    const gutters = buildGutters(clues);

    expect(gutters.top?.[0]?.description).toBe('3 buildings visible from the top of column 1');
    expect(gutters.start?.[0]?.description).toBe('1 building visible from the start of row 1');
  });
});
