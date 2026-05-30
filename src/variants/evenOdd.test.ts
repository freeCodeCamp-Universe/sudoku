import { describe, expect, it } from 'vitest';
import { buildModel } from '@/engine/buildModel';
import { cellId } from '@/engine/grid';
import { generate } from '@/engine/generate';
import { solve } from '@/engine/solve';
import type { VariantModel } from '@/engine/types';
import { validate } from '@/engine/validate';
import { evenOdd } from './evenOdd';

function seeded(seed: number): () => number {
  let state = seed;

  return () => {
    state = (state * 1103515245 + 12345) & 0x7fffffff;
    return state / 0x7fffffff;
  };
}

describe('evenOdd variant', () => {
  it('should have 9x9 grid layout', () => {
    expect(evenOdd.layout).toEqual({ kind: 'grid', size: 9, box: { rows: 3, cols: 3 } });
  });

  it('should include uniqueness and evenOdd constraint ids', () => {
    expect(evenOdd.constraintIds).toContain('uniqueness');
    expect(evenOdd.constraintIds).toContain('evenOdd');
  });

  it('should include the evenOdd-shading overlay id', () => {
    expect(evenOdd.overlayIds).toContain('evenOdd-shading');
  });

  it('should include even-cell and odd-cell annotator ids', () => {
    expect(evenOdd.annotatorIds).toContain('even-cell');
    expect(evenOdd.annotatorIds).toContain('odd-cell');
  });

  it('should derive a parityMap with 81 entries matching solution parities', () => {
    const model = buildModel(evenOdd);
    const { solution } = generate(model, 'intermediate', seeded(50));
    const structure = evenOdd.deriveStructure?.(solution, model) as {
      parityMap: Map<string, 0 | 1>;
    };
    const id = cellId(0, 0);
    const value = solution.get(id);

    expect(structure.parityMap.size).toBe(81);
    expect(structure.parityMap.get(id)).toBe((value ?? 0) % 2);
  });

  it('should detect a parity violation via the evenOdd constraint', () => {
    const model = buildModel(evenOdd);
    const { solution } = generate(model, 'intermediate', seeded(51));
    const structure = evenOdd.deriveStructure?.(solution, model) as {
      parityMap: Map<string, 0 | 1>;
    };
    const modelWithStructure: VariantModel = { ...model, structure };
    const id = cellId(0, 0);
    const correctParity = structure.parityMap.get(id) ?? 0;
    const wrongValue = [1, 2, 3, 4, 5, 6, 7, 8, 9].find((value) => value % 2 !== correctParity);
    const brokenValues = new Map([[id, wrongValue ?? 1]]);
    const conflicts = validate(brokenValues, modelWithStructure);

    expect(conflicts.some((conflict) => conflict.constraintId === 'evenOdd')).toBe(true);
  });

  it('should generate a puzzle solvable with parity structure attached', () => {
    const model = buildModel(evenOdd);
    const { givens, solution } = generate(model, 'intermediate', seeded(52));
    const structure = evenOdd.deriveStructure?.(solution, model);
    const modelWithStructure: VariantModel = { ...model, structure };

    expect(solve(modelWithStructure, givens, { max: 2 })).toHaveLength(1);
  });
});
