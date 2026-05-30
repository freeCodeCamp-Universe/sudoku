import type { Conflict, Constraint } from '../types';

export const uniqueness: Constraint = {
  id: 'uniqueness',
  conflicts(values, model) {
    const conflicts: Conflict[] = [];

    for (const house of model.houses) {
      const seen = new Map<number, string[]>();

      for (const id of house.cells) {
        const value = values.get(id);
        if (value === undefined) {
          continue;
        }

        const ids = seen.get(value) ?? [];
        ids.push(id);
        seen.set(value, ids);
      }

      for (const ids of seen.values()) {
        if (ids.length > 1) {
          conflicts.push({ cells: ids, constraintId: 'uniqueness' });
        }
      }
    }

    return conflicts;
  },
  permits(values, cellId, value, model) {
    for (const house of model.houses) {
      if (!house.cells.includes(cellId)) {
        continue;
      }

      for (const id of house.cells) {
        if (id !== cellId && values.get(id) === value) {
          return false;
        }
      }
    }

    return true;
  },
};
