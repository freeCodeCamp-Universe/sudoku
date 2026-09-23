import { describe, expect, it } from 'vitest';
import { validate } from '@/engine/validate';
import { solve } from '@/engine/solve';
import { buildModel } from '@/engine/buildModel';
import { generate } from '@/engine/generate';
import { assemblePuzzle } from '@/board/assemblePuzzle';
import { allVariants } from './allVariants';
import { makeFixture, seeded } from './makeFixture';

const SEEDS = [1, 2, 3, 4, 5];

// Generating and uniqueness-checking the largest multigrid models (samurai, a
// 369-cell board) across five seeds is deterministic but legitimately heavy —
// nominally ~5s, which crosses the default 5s per-test timeout under parallel
// CPU load. Give these cases generous headroom rather than trimming coverage.
const SLOW_TEST_TIMEOUT_MS = 30_000;

describe('generation soundness', () => {
  it.each(allVariants())(
    'should produce a complete, valid solution for $id',
    (variant) => {
      const { model, solution } = makeFixture(variant, 1);
      expect(solution.size).toBe(model.cells.length);
      expect(validate(solution, model)).toEqual([]);
    },
    SLOW_TEST_TIMEOUT_MS
  );

  it.each(allVariants())(
    'should produce a uniquely solvable puzzle for $id',
    (variant) => {
      const baseModel = buildModel(variant);
      const uniqueOnAllSeeds = SEEDS.every((s) => {
        const { givens, solution } = generate(baseModel, 'intermediate', seeded(s));
        const { model } = assemblePuzzle(variant, baseModel, solution);
        return solve(model, givens, { max: 2 }).length === 1;
      });
      expect(uniqueOnAllSeeds).toBe(true);
    },
    SLOW_TEST_TIMEOUT_MS
  );
});
