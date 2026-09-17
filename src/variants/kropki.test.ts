import { describe, expect, it } from 'vitest';
import { buildModel } from '@/engine/buildModel';
import { cellId } from '@/engine/grid';
import { generate } from '@/engine/generate';
import { solve } from '@/engine/solve';
import { validate } from '@/engine/validate';
import type { KropkiMark } from '@/engine/constraints/kropki';
import { kropki } from './kropki';

function seeded(seed: number): () => number {
  let state = seed;

  return () => {
    state = (state * 1103515245 + 12345) & 0x7fffffff;
    return state / 0x7fffffff;
  };
}

describe('kropki variant', () => {
  it('should have the correct layout and constraint ids', () => {
    expect(kropki.id).toBe('kropki');
    expect(kropki.layout).toEqual({ kind: 'grid', size: 9, box: { rows: 3, cols: 3 } });
    expect(kropki.constraintIds).toContain('uniqueness');
    expect(kropki.constraintIds).toContain('kropki');
  });

  it('should derive only valid marks from the solution', () => {
    const model = buildModel(kropki);
    const { solution } = generate(model, 'intermediate', seeded(30));
    const structure = kropki.deriveStructure?.(solution, model) as {
      kropkiMarks: KropkiMark[];
    };

    expect(structure.kropkiMarks.length).toBeGreaterThan(0);

    const blackMarks = structure.kropkiMarks.filter(({ kind }) => kind === 'black');
    const whiteMarks = structure.kropkiMarks.filter(({ kind }) => kind === 'white');

    expect(
      blackMarks.every(({ a, b }) => {
        const aValue = solution.get(a) ?? 0;
        const bValue = solution.get(b) ?? 0;

        return aValue === 2 * bValue || bValue === 2 * aValue;
      })
    ).toBe(true);
    expect(
      whiteMarks.every(({ a, b }) => {
        const aValue = solution.get(a) ?? 0;
        const bValue = solution.get(b) ?? 0;

        return Math.abs(aValue - bValue) === 1 && aValue !== 2 * bValue && bValue !== 2 * aValue;
      })
    ).toBe(true);
  });

  it('should derive each adjacent pair at most once', () => {
    const model = buildModel(kropki);
    const { solution } = generate(model, 'intermediate', seeded(31));
    const structure = kropki.deriveStructure?.(solution, model) as {
      kropkiMarks: KropkiMark[];
    };
    const pairKeys = structure.kropkiMarks.map(({ a, b }) => [a, b].sort().join('|'));

    expect(new Set(pairKeys).size).toBe(pairKeys.length);
  });

  it('should generate a uniquely solvable puzzle when structure is merged into the model', () => {
    const model = buildModel(kropki);
    const { solution, givens } = generate(model, 'intermediate', seeded(32));
    const structure = kropki.deriveStructure?.(solution, model);
    const modelWithStructure = { ...model, structure };

    expect(solve(modelWithStructure, givens, { max: 2 })).toHaveLength(1);
  });

  it('should detect a known violation via validate for a marked pair', () => {
    const model = buildModel(kropki);
    const { solution } = generate(model, 'intermediate', seeded(33));
    const structure = kropki.deriveStructure?.(solution, model) as {
      kropkiMarks: KropkiMark[];
    };
    const mark = structure.kropkiMarks[0];
    const brokenValues = new Map(solution);
    const peerValue = solution.get(mark.b) ?? 1;
    const modelWithStructure = { ...model, structure };

    brokenValues.set(mark.a, mark.kind === 'black' ? peerValue : peerValue + 2);

    expect(
      validate(brokenValues, modelWithStructure).some(
        (conflict) => conflict.constraintId === 'kropki'
      )
    ).toBe(true);
  });

  it('should detect a known violation via validate for an unmarked adjacent pair', () => {
    const model = buildModel(kropki);
    const { solution } = generate(model, 'intermediate', seeded(34));
    const structure = kropki.deriveStructure?.(solution, model) as {
      kropkiMarks: KropkiMark[];
    };
    const markedPairs = new Set(structure.kropkiMarks.map(({ a, b }) => [a, b].sort().join('|')));
    const modelWithStructure = { ...model, structure };
    let foundViolation = false;

    for (let row = 0; row < 9 && !foundViolation; row += 1) {
      for (let col = 0; col < 8; col += 1) {
        const left = cellId(row, col);
        const right = cellId(row, col + 1);

        if (markedPairs.has([left, right].sort().join('|'))) continue;

        const brokenValues = new Map(solution);
        brokenValues.set(left, 3);
        brokenValues.set(right, 4);

        if (
          validate(brokenValues, modelWithStructure).some(
            (conflict) => conflict.constraintId === 'kropki'
          )
        ) {
          foundViolation = true;
          break;
        }
      }
    }

    expect(foundViolation).toBe(true);
  });
});
