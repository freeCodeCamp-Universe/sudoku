import { shuffle } from './grid';
import { assignValue, createSearchState, pickNextCell, unassignValue } from './searchState';
import { solve } from './solve';
import type { Difficulty, Solution, Values, VariantModel } from './types';

export function cluesFor(difficulty: Difficulty, totalCells: number): number {
  const ratio: Record<Difficulty, number> = {
    beginner: 0.5,
    intermediate: 0.4,
    advanced: 0.3,
  };

  return Math.round(totalCells * ratio[difficulty]);
}

export function generateSolution(
  model: VariantModel,
  rng: () => number = Math.random
): Solution {
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
  const givens: Values = new Map(solution);
  const target = cluesFor(difficulty, model.cells.length);

  for (const id of shuffle([...givens.keys()], rng)) {
    if (givens.size <= target) {
      break;
    }

    const saved = givens.get(id);
    if (saved === undefined) {
      continue;
    }

    givens.delete(id);

    if (solve(model, givens, { max: 2 }).length !== 1) {
      givens.set(id, saved);
    }
  }

  return { solution, givens };
}
