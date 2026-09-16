import { shuffle } from '@/engine/grid';
import { hasUniqueSolution, solve } from '@/engine/solve';
import type { Difficulty, Solution, Values, VariantModel } from '@/engine/types';

export function makeGenerateGivens(baseTarget: number) {
  return function generateGivens(
    solution: Solution,
    model: VariantModel,
    _difficulty: Difficulty,
    rng: (() => number) | undefined = Math.random,
    modeMultiplier = 1
  ): Values {
    const safRng = rng ?? Math.random;
    const givens: Values = new Map(solution);
    const uniquenessOnly = model.constraints.every((c) => c.id === 'uniqueness');
    // Clue removal only ever happens once uniqueness is proven (below), so an
    // unreachable target just means the loop stops early with more clues than
    // asked for — never an ambiguous puzzle. For variants with a small
    // baseTarget (e.g. killer=15, mini=4), Expert's lower target can end up
    // indistinguishable from Medium for this reason; that's an accepted UX
    // limitation, not a bug.
    const target = Math.min(
      Math.max(1, Math.round(baseTarget * modeMultiplier)),
      model.cells.length
    );

    for (const id of shuffle([...givens.keys()], safRng)) {
      if (givens.size <= target) break;
      const saved = givens.get(id);
      if (saved === undefined) continue;
      givens.delete(id);
      const provenUnique = uniquenessOnly
        ? hasUniqueSolution(model, givens, { nodeBudget: 50_000 })
        : solve(model, givens, { max: 2 }).length === 1;
      if (!provenUnique) givens.set(id, saved);
    }

    return givens;
  };
}

export const generateGivens9x9 = makeGenerateGivens(27);
