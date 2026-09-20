import { shuffle } from '@/engine/grid';
import { hasUniqueSolution, solve } from '@/engine/solve';
import type { Difficulty, Solution, Values, VariantModel } from '@/engine/types';

interface GenerateGivensOptions {
  baseTarget: number;
  nodeBudget?: number;
  deriveStructure?: (solution: Solution, model: VariantModel) => unknown;
}

export function makeGenerateGivens(
  baseTargetOrOptions: number | GenerateGivensOptions,
  nodeBudget = 50_000
) {
  const opts: GenerateGivensOptions =
    typeof baseTargetOrOptions === 'number'
      ? { baseTarget: baseTargetOrOptions, nodeBudget }
      : { nodeBudget, ...baseTargetOrOptions };

  return function generateGivens(
    solution: Solution,
    model: VariantModel,
    _difficulty: Difficulty,
    rng: (() => number) | undefined = Math.random,
    modeMultiplier = 1
  ): Values {
    const safeRng = rng ?? Math.random;
    const givens: Values = new Map(solution);
    const solveModel = opts.deriveStructure
      ? { ...model, structure: opts.deriveStructure(solution, model) }
      : model;
    const uniquenessOnly = solveModel.constraints.every((c) => c.id === 'uniqueness');
    // Clue removal only ever happens once uniqueness is proven (below), so an
    // unreachable target just means the loop stops early with more clues than
    // asked for — never an ambiguous puzzle.
    const target = Math.min(
      Math.max(1, Math.round(opts.baseTarget * modeMultiplier)),
      solveModel.cells.length
    );
    const budget = opts.nodeBudget ?? 50_000;

    for (const id of shuffle([...givens.keys()], safeRng)) {
      if (givens.size <= target) {
        break;
      }
      const saved = givens.get(id);
      if (saved === undefined) {
        continue;
      }
      givens.delete(id);
      const provenUnique = uniquenessOnly
        ? hasUniqueSolution(solveModel, givens, { nodeBudget: budget })
        : solve(solveModel, givens, { max: 2 }).length === 1;
      if (!provenUnique) {
        givens.set(id, saved);
      }
    }

    return givens;
  };
}

export const generateGivens9x9 = makeGenerateGivens(27);
