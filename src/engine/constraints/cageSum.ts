import type { CellId, Conflict, Constraint, SymbolValue, Values, VariantModel } from '../types';
import type { Cage } from '@/game/gameTypes';

function getCages(model: VariantModel): Cage[] {
  return (model.structure as { cages?: Cage[] } | undefined)?.cages ?? [];
}

function isSumFeasible(cellCount: number, targetSum: number, usedDigits: Set<number>): boolean {
  const available: number[] = [];
  for (let d = 1; d <= 9; d += 1) {
    if (!usedDigits.has(d)) {
      available.push(d);
    }
  }

  if (available.length < cellCount) {
    return false;
  }

  let minSum = 0;
  for (let i = 0; i < cellCount; i += 1) {
    minSum += available[i];
  }

  let maxSum = 0;
  for (let i = available.length - 1; i >= available.length - cellCount; i -= 1) {
    maxSum += available[i];
  }

  return targetSum >= minSum && targetSum <= maxSum;
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

      let partialSum = 0;
      let emptyCount = 0;
      const usedDigits = new Set<number>();

      for (const id of cage.cells) {
        if (id === cellId) {
          continue;
        }

        const existing = values.get(id);
        if (existing !== undefined) {
          if (existing === value) {
            return false;
          }
          partialSum += existing;
          usedDigits.add(existing);
        } else {
          emptyCount += 1;
        }
      }

      const sumAfterPlacement = partialSum + value;
      usedDigits.add(value);

      if (emptyCount === 0) {
        if (sumAfterPlacement !== cage.sum) {
          return false;
        }
      } else {
        const remaining = cage.sum - sumAfterPlacement;
        if (!isSumFeasible(emptyCount, remaining, usedDigits)) {
          return false;
        }
      }
    }

    return true;
  },
};
