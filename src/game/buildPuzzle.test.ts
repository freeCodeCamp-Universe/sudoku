import { describe, expect, it } from 'vitest';
import { getVariant } from '@/variants/registry';
import { buildPuzzle } from './buildPuzzle';

// The puzzle a session shows must be a pure function of its stable inputs. React
// may re-run the generation memo (StrictMode in dev, Fast Refresh on edit, or a
// dropped cache) while the reducer keeps the original givens; if generation is
// non-deterministic, the new solution desyncs from those givens and untouched
// cells get flagged incorrect. Identical inputs must yield an identical puzzle.
describe('buildPuzzle', () => {
  it('should return an identical puzzle for identical inputs', () => {
    const variant = getVariant('classic');

    const first = buildPuzzle(variant, 0, 0, 42);
    const second = buildPuzzle(variant, 0, 0, 42);

    expect([...second.givens.entries()]).toEqual([...first.givens.entries()]);
    expect([...second.solution.entries()]).toEqual([...first.solution.entries()]);
  });

  it('should return a different puzzle when the session seed changes', () => {
    const variant = getVariant('classic');

    const first = buildPuzzle(variant, 0, 0, 1);
    const second = buildPuzzle(variant, 0, 0, 2);

    expect([...second.solution.entries()]).not.toEqual([...first.solution.entries()]);
  });

  it('should return a different puzzle when the new-game counter changes', () => {
    const variant = getVariant('classic');

    const first = buildPuzzle(variant, 0, 0, 42);
    const second = buildPuzzle(variant, 0, 1, 42);

    expect([...second.solution.entries()]).not.toEqual([...first.solution.entries()]);
  });
});
