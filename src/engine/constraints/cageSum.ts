import type { CellId, Conflict, Constraint, SymbolValue, Values, VariantModel } from '../types';
import type { Cage } from '@/game/gameTypes';

function getCages(model: VariantModel): Cage[] {
  return (model.structure as { cages?: Cage[] } | undefined)?.cages ?? [];
}

const cageByModel = new WeakMap<VariantModel, Map<CellId, Cage>>();

function getCageByCell(model: VariantModel): Map<CellId, Cage> {
  const cached = cageByModel.get(model);
  if (cached) {
    return cached;
  }

  const byCell = new Map<CellId, Cage>();
  for (const cage of getCages(model)) {
    for (const id of cage.cells) {
      byCell.set(id, cage);
    }
  }
  cageByModel.set(model, byCell);
  return byCell;
}

function isSumFeasible(cellCount: number, targetSum: number, usedMask: number): boolean {
  let availableCount = 0;
  let minSum = 0;
  let maxSum = 0;

  for (let d = 1; d <= 9; d += 1) {
    if ((usedMask & (1 << d)) === 0) {
      availableCount += 1;
      if (availableCount <= cellCount) {
        minSum += d;
      }
    }
  }

  if (availableCount < cellCount) {
    return false;
  }

  let remaining = cellCount;
  for (let d = 9; d >= 1 && remaining > 0; d -= 1) {
    if ((usedMask & (1 << d)) === 0) {
      maxSum += d;
      remaining -= 1;
    }
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
    const cage = getCageByCell(model).get(cellId);
    if (!cage) {
      return true;
    }

    let partialSum = 0;
    let emptyCount = 0;
    let usedMask = 0;

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
        usedMask |= 1 << existing;
      } else {
        emptyCount += 1;
      }
    }

    const sumAfterPlacement = partialSum + value;
    usedMask |= 1 << value;

    if (emptyCount === 0) {
      return sumAfterPlacement === cage.sum;
    }

    const remaining = cage.sum - sumAfterPlacement;
    if (!isSumFeasible(emptyCount, remaining, usedMask)) {
      return false;
    }

    return true;
  },
};
