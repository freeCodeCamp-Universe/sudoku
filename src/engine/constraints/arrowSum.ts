import type { Arrow } from '@/game/gameTypes';
import type { CellId, Conflict, Constraint, SymbolValue, Values, VariantModel } from '../types';

function getArrows(model: VariantModel): Arrow[] {
  return (model.structure as { arrows?: Arrow[] } | undefined)?.arrows ?? [];
}

export const arrowSum: Constraint = {
  id: 'arrowSum',

  conflicts(values: Values, model: VariantModel): Conflict[] {
    const arrows = getArrows(model);
    const conflicts: Conflict[] = [];

    for (const { bulb, path } of arrows) {
      const arrowCells = [bulb, ...path];
      if (!arrowCells.every((id) => values.has(id))) {
        continue;
      }

      const bulbValue = values.get(bulb);
      if (bulbValue === undefined) {
        continue;
      }

      const pathSum = path.reduce((sum, id) => sum + (values.get(id) ?? 0), 0);
      if (pathSum !== bulbValue) {
        conflicts.push({ cells: arrowCells, constraintId: 'arrowSum' });
      }
    }

    return conflicts;
  },

  permits(values: Values, cellId: CellId, value: SymbolValue, model: VariantModel): boolean {
    const arrows = getArrows(model);

    for (const { bulb, path } of arrows) {
      if (!path.includes(cellId)) {
        continue;
      }

      const bulbValue = values.get(bulb);
      if (bulbValue === undefined) {
        continue;
      }

      const partialSum = path.reduce((sum, id) => {
        if (id === cellId) {
          return sum + value;
        }

        return sum + (values.get(id) ?? 0);
      }, 0);
      const remaining = path.filter((id) => id !== cellId && !values.has(id)).length;

      if (partialSum + remaining > bulbValue) {
        return false;
      }

      if (partialSum > bulbValue) {
        return false;
      }
    }

    return true;
  },
};
