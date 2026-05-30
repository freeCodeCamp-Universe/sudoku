import type { CellId, Solution, SymbolValue, Values, VariantModel } from './types';

function permitted(
  values: Values,
  cellId: CellId,
  value: SymbolValue,
  model: VariantModel
): boolean {
  return model.constraints.every((constraint) =>
    constraint.permits ? constraint.permits(values, cellId, value, model) : true
  );
}

export function solve(model: VariantModel, given: Values, opts: { max?: number } = {}): Solution[] {
  const max = opts.max ?? 1;
  const values: Values = new Map(given);
  const solutions: Solution[] = [];

  if (model.constraints.some((constraint) => constraint.conflicts(values, model).length > 0)) {
    return solutions;
  }

  const empties = model.cells.map((cell) => cell.id).filter((id) => !values.has(id));

  function backtrack(index: number): void {
    if (solutions.length >= max) {
      return;
    }

    if (index === empties.length) {
      solutions.push(new Map(values));
      return;
    }

    const id = empties[index];

    for (const value of model.symbols) {
      if (!permitted(values, id, value, model)) {
        continue;
      }

      values.set(id, value);
      backtrack(index + 1);
      values.delete(id);

      if (solutions.length >= max) {
        return;
      }
    }
  }

  backtrack(0);
  return solutions;
}
