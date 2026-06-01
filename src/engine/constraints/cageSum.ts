import type { CellId, Conflict, Constraint, SymbolValue, Values, VariantModel } from '../types';
import type { Cage } from '@/game/gameTypes';

function getCages(model: VariantModel): Cage[] {
  return (model.structure as { cages?: Cage[] } | undefined)?.cages ?? [];
}

export const cageSum: Constraint = {
  id: 'cageSum',

  conflicts(values: Values, model: VariantModel): Conflict[] {
    const cages = getCages(model);
    const conflicts: Conflict[] = [];

    for (const cage of cages) {
      const filled = cage.cells.filter((id) => values.has(id));
      const seen = new Map<SymbolValue, CellId>();

      for (const id of filled) {
        const value = values.get(id);

        if (value === undefined) {
          continue;
        }

        const previous = seen.get(value);
        if (previous !== undefined) {
          conflicts.push({ cells: [previous, id], constraintId: 'cageSum' });
        } else {
          seen.set(value, id);
        }
      }

      if (filled.length !== cage.cells.length) {
        continue;
      }

      const total = filled.reduce((sum, id) => sum + (values.get(id) ?? 0), 0);
      if (total !== cage.sum) {
        conflicts.push({ cells: [...cage.cells], constraintId: 'cageSum' });
      }
    }

    return conflicts;
  },

  permits(values: Values, cellId: CellId, value: SymbolValue, model: VariantModel): boolean {
    const cages = getCages(model);

    for (const cage of cages) {
      if (!cage.cells.includes(cellId)) {
        continue;
      }

      for (const id of cage.cells) {
        if (id !== cellId && values.get(id) === value) {
          return false;
        }
      }
    }

    return true;
  },
};
