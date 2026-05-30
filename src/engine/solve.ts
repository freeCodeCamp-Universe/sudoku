import { assignValue, createSearchState, pickNextCell, unassignValue } from './searchState';
import type { Solution, Values, VariantModel } from './types';

export function solve(model: VariantModel, given: Values, opts: { max?: number } = {}): Solution[] {
  const max = opts.max ?? 1;
  const values: Values = new Map(given);
  const solutions: Solution[] = [];

  if (model.constraints.some((constraint) => constraint.conflicts(values, model).length > 0)) {
    return solutions;
  }

  const state = createSearchState(model, values);

  function backtrack(): void {
    if (solutions.length >= max) {
      return;
    }

    const { cellId, candidates } = pickNextCell(state, values, model);

    if (cellId === null) {
      if (candidates.length === 0 && values.size !== model.cells.length) {
        return;
      }

      solutions.push(new Map(values));
      return;
    }

    for (const value of candidates) {
      assignValue(state, values, cellId, value);
      backtrack();
      unassignValue(state, values, cellId, value);

      if (solutions.length >= max) {
        return;
      }
    }
  }

  backtrack();
  return solutions;
}
