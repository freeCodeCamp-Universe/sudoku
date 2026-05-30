import type { CellId, Conflict, Constraint, VariantModel } from '../types';

type ParityMap = Map<CellId, 0 | 1>;

function getParityMap(model: VariantModel): ParityMap | undefined {
  const structure = model.structure as { parityMap?: ParityMap } | undefined;

  return structure?.parityMap;
}

export const evenOdd: Constraint = {
  id: 'evenOdd',
  conflicts(values, model) {
    const parityMap = getParityMap(model);

    if (!parityMap) {
      return [];
    }

    const conflicts: Conflict[] = [];

    for (const [cellId, requiredParity] of parityMap) {
      const value = values.get(cellId);

      if (value === undefined) {
        continue;
      }

      if (value % 2 !== requiredParity) {
        conflicts.push({ cells: [cellId], constraintId: 'evenOdd' });
      }
    }

    return conflicts;
  },
  permits(_values, cellId, value, model) {
    const parityMap = getParityMap(model);

    if (!parityMap) {
      return true;
    }

    const requiredParity = parityMap.get(cellId);

    if (requiredParity === undefined) {
      return true;
    }

    return value % 2 === requiredParity;
  },
};
