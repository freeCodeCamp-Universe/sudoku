import type { CellId, Conflict, Constraint, VariantModel } from '../types';

export interface Relation {
  greater: CellId;
  lesser: CellId;
}

function getRelations(model: VariantModel): Relation[] {
  const structure = model.structure as { relations?: Relation[] } | undefined;

  return structure?.relations ?? [];
}

export const greaterThan: Constraint = {
  id: 'greaterThan',
  conflicts(values, model) {
    const conflicts: Conflict[] = [];

    for (const { greater, lesser } of getRelations(model)) {
      const greaterValue = values.get(greater);
      const lesserValue = values.get(lesser);

      if (greaterValue === undefined || lesserValue === undefined) {
        continue;
      }

      if (greaterValue <= lesserValue) {
        conflicts.push({ cells: [greater, lesser], constraintId: 'greaterThan' });
      }
    }

    return conflicts;
  },
  permits(values, cellId, value, model) {
    for (const { greater, lesser } of getRelations(model)) {
      if (cellId === greater) {
        const lesserValue = values.get(lesser);

        if (lesserValue !== undefined && value <= lesserValue) {
          return false;
        }
      }

      if (cellId === lesser) {
        const greaterValue = values.get(greater);

        if (greaterValue !== undefined && value >= greaterValue) {
          return false;
        }
      }
    }

    return true;
  },
};
