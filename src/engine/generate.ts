import { shuffle } from './grid';
import { assignValue, createSearchState, pickNextCell, unassignValue } from './searchState';
import { hasUniqueSolution, solve } from './solve';
import type { Difficulty, Solution, Values, VariantModel } from './types';

export function cluesFor(difficulty: Difficulty, totalCells: number): number {
  const ratio: Record<Difficulty, number> = {
    beginner: 0.5,
    intermediate: 0.4,
    advanced: 0.3,
  };

  return Math.round(totalCells * ratio[difficulty]);
}

const UNIQUENESS_NODE_BUDGET = 50_000;

export function generateSolution(
  model: VariantModel,
  rng: () => number = Math.random
): Solution {
  if (model.generateSolution) {
    return model.generateSolution(model, rng);
  }

  const values: Values = new Map();
  const state = createSearchState(model, values);

  function backtrack(): boolean {
    const { cellId, candidates } = pickNextCell(state, values, model, (candidateValues) =>
      shuffle(candidateValues, rng)
    );

    if (cellId === null) {
      if (candidates.length === 0 && values.size !== model.cells.length) {
        return false;
      }

      return true;
    }

    for (const value of candidates) {
      assignValue(state, values, cellId, value);
      if (backtrack()) {
        return true;
      }
      unassignValue(state, values, cellId, value);
    }

    return false;
  }

  if (!backtrack()) {
    throw new Error('Failed to generate a complete solution');
  }

  return values;
}

export function generate(
  model: VariantModel,
  difficulty: Difficulty,
  rng: () => number = Math.random
): { solution: Solution; givens: Values } {
  const solution = generateSolution(model, rng);
  if (model.generateGivens) {
    return {
      solution,
      givens: model.generateGivens(solution, model, difficulty, rng),
    };
  }

  const givens: Values = new Map(solution);
  const target = Math.max(cluesFor(difficulty, model.cells.length), model.minimumClues ?? 0);
  const uniquenessOnly = model.constraints.every((constraint) => constraint.id === 'uniqueness');

  for (const id of shuffle([...givens.keys()], rng)) {
    if (givens.size <= target) {
      break;
    }

    const saved = givens.get(id);
    if (saved === undefined) {
      continue;
    }

    givens.delete(id);

    // Invariant: we start from a full solved grid, and remove a clue only when uniqueness is proven.
    // If the bounded search cannot prove uniqueness, we keep the clue; that can make puzzles denser,
    // but it cannot introduce ambiguity because we only remove proven-safe clues.
    const provenUnique = uniquenessOnly
      ? hasUniqueSolution(model, givens, { nodeBudget: UNIQUENESS_NODE_BUDGET })
      : solve(model, givens, { max: 2 }).length === 1;

    if (!provenUnique) {
      givens.set(id, saved);
    }
  }

  return { solution, givens };
}
