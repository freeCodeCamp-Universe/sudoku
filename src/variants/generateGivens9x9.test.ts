import { describe, expect, it } from 'vitest';
import { buildModel } from '@/engine/buildModel';
import { generateSolution } from '@/engine/generate';
import { classic } from './classic';
import { makeGenerateGivens } from './generateGivens9x9';

function seeded(seed: number): () => number {
  let state = seed;

  return () => {
    state = (state * 1103515245 + 12345) & 0x7fffffff;
    return state / 0x7fffffff;
  };
}

describe('makeGenerateGivens', () => {
  const model = buildModel(classic);

  it('should target the base count when no multiplier is given', () => {
    const generateGivens = makeGenerateGivens(27);
    const solution = generateSolution(model, seeded(1));
    const givens = generateGivens(solution, model, 'advanced', seeded(2));

    expect(givens.size).toBe(27);
  });

  it('should scale the target by the mode multiplier', () => {
    const generateGivens = makeGenerateGivens(27);
    const solution = generateSolution(model, seeded(3));
    const easy = generateGivens(solution, model, 'advanced', seeded(4), 1.2);
    const base = generateGivens(solution, model, 'advanced', seeded(4), 1);
    const expert = generateGivens(solution, model, 'advanced', seeded(4), 0.8);

    // Easy's higher target is always reachable (removing fewer clues is never
    // harder to prove unique). Expert's lower target is not always reachable
    // -- removal only happens once uniqueness is proven -- so it is only
    // guaranteed to be no sparser than the base target, not exactly on target.
    expect(easy.size).toBe(32);
    expect(base.size).toBe(27);
    expect(expert.size).toBeLessThanOrEqual(base.size);
  });

  it('should never target more clues than the model has cells', () => {
    const generateGivens = makeGenerateGivens(27);
    const solution = generateSolution(model, seeded(5));
    // A multiplier this large would compute a target above 81; the loop must
    // clamp instead of leaving every cell as a given regardless of proof.
    const givens = generateGivens(solution, model, 'advanced', seeded(6), 10);

    expect(givens.size).toBe(81);
  });

  it('should never target fewer than one clue', () => {
    const generateGivens = makeGenerateGivens(1);
    const solution = generateSolution(model, seeded(7));
    const givens = generateGivens(solution, model, 'advanced', seeded(8), 0);

    expect(givens.size).toBeGreaterThanOrEqual(1);
  });

  it('should produce givens with exactly one solution at every multiplier', () => {
    const generateGivens = makeGenerateGivens(27);
    const solution = generateSolution(model, seeded(9));

    for (const modeMultiplier of [1.2, 1, 0.8]) {
      const givens = generateGivens(solution, model, 'advanced', seeded(10), modeMultiplier);

      for (const [cellId, value] of givens) {
        expect(value).toBe(solution.get(cellId));
      }
    }
  });
});
