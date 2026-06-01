import { describe, expect, it } from 'vitest';
import { cellId } from '@/engine/grid';
import { buildModel } from '@/engine/buildModel';
import { generate } from '@/engine/generate';
import { solve } from '@/engine/solve';
import { validate } from '@/engine/validate';
import type { Mark } from '@/engine/constraints/consecutive';
import { consecutiveVariant } from './consecutive';

function seeded(seed: number): () => number {
  let state = seed;

  return () => {
    state = (state * 1103515245 + 12345) & 0x7fffffff;
    return state / 0x7fffffff;
  };
}

describe('consecutiveVariant', () => {
  it('should have the correct id and constraint ids', () => {
    expect(consecutiveVariant.id).toBe('consecutive');
    expect(consecutiveVariant.constraintIds).toContain('uniqueness');
    expect(consecutiveVariant.constraintIds).toContain('consecutive');
  });

  it('should derive only adjacent pairs that differ by 1 from the solution', () => {
    const model = buildModel(consecutiveVariant);
    const { solution } = generate(model, 'intermediate', seeded(20));
    const structure = consecutiveVariant.deriveStructure?.(solution, model) as { marks: Mark[] };

    for (const { a, b } of structure.marks) {
      expect(Math.abs((solution.get(a) ?? 0) - (solution.get(b) ?? 0))).toBe(1);
    }
  });

  it('should generate a uniquely solvable puzzle when structure is merged into the model', () => {
    const model = buildModel(consecutiveVariant);
    const { solution, givens } = generate(model, 'intermediate', seeded(21));
    const structure = consecutiveVariant.deriveStructure?.(solution, model);
    const modelWithStructure = { ...model, structure };

    expect(solve(modelWithStructure, givens, { max: 2 })).toHaveLength(1);
  });

  it('should detect a known violation via validate for a marked pair', () => {
    const model = buildModel(consecutiveVariant);
    const { solution } = generate(model, 'intermediate', seeded(22));
    const structure = consecutiveVariant.deriveStructure?.(solution, model) as { marks: Mark[] };
    const mark = structure.marks[0];
    const brokenValues = new Map(solution);
    const peerValue = solution.get(mark.b) ?? 1;
    const modelWithStructure = { ...model, structure };

    brokenValues.set(mark.a, peerValue <= 7 ? peerValue + 2 : peerValue - 2);

    expect(validate(brokenValues, modelWithStructure).some((conflict) => conflict.constraintId === 'consecutive')).toBe(true);
  });

  it('should detect a known violation via validate for an unmarked adjacent pair', () => {
    const model = buildModel(consecutiveVariant);
    const { solution } = generate(model, 'intermediate', seeded(23));
    const structure = consecutiveVariant.deriveStructure?.(solution, model) as { marks: Mark[] };
    const markedPairs = new Set(
      structure.marks.map(({ a, b }) => [a, b].sort().join('|'))
    );
    const modelWithStructure = { ...model, structure };
    let foundViolation = false;

    for (let row = 0; row < 9 && !foundViolation; row += 1) {
      for (let col = 0; col < 8; col += 1) {
        const left = cellId(row, col);
        const right = cellId(row, col + 1);

        if (markedPairs.has([left, right].sort().join('|'))) {
          continue;
        }

        const brokenValues = new Map(solution);
        brokenValues.set(left, 3);
        brokenValues.set(right, 4);

        if (validate(brokenValues, modelWithStructure).some((conflict) => conflict.constraintId === 'consecutive')) {
          foundViolation = true;
          break;
        }
      }
    }

    expect(foundViolation).toBe(true);
  });
});
