import { shuffle } from '@/engine/grid';
import { hasUniqueSolution, solve } from '@/engine/solve';
import type { Difficulty, Solution, Values, VariantModel } from '@/engine/types';

export function makeGenerateGivens(target: number) {
  return function generateGivens(
    solution: Solution,
    model: VariantModel,
    _difficulty: Difficulty,
    rng: (() => number) | undefined = Math.random
  ): Values {
    const safRng = rng ?? Math.random;
    const givens: Values = new Map(solution);
    const uniquenessOnly = model.constraints.every((c) => c.id === 'uniqueness');

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
