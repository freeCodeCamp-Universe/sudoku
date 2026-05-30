import { shuffle } from './grid';
import { solve } from './solve';
import type { Difficulty, Solution, SymbolValue, Values, VariantModel } from './types';

function permitted(
  values: Values,
  cellId: string,
  value: SymbolValue,
  model: VariantModel
): boolean {
  return model.constraints.every((constraint) =>
    constraint.permits ? constraint.permits(values, cellId, value, model) : true
  );
}

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
  const ids = model.cells.map((cell) => cell.id);
  const values: Values = new Map();

  function backtrack(index: number): boolean {
    if (index === ids.length) {
      return true;
    }

    const id = ids[index];

    for (const value of shuffle(model.symbols, rng)) {
      if (!permitted(values, id, value, model)) {
        continue;
      }

      values.set(id, value);
      if (backtrack(index + 1)) {
        return true;
      }
      values.delete(id);
    }

    return false;
  }

  if (!backtrack(0)) {
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
