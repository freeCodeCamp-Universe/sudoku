import type { CellId, Conflict, Constraint, SymbolValue, VariantModel } from '../types';

export interface Chain {
  cells: CellId[];
  color: string;
}

function getChains(model: VariantModel): Chain[] {
  const structure = model.structure as { chains?: Chain[] } | undefined;

  return structure?.chains ?? [];
}

export const chain: Constraint = {
  id: 'chain',
  conflicts(values, model) {
    const conflicts: Conflict[] = [];

    for (const chainDef of getChains(model)) {
      const filled = chainDef.cells
        .map((cellId) => ({ cellId, value: values.get(cellId) }))
        .filter(
          (entry): entry is { cellId: CellId; value: SymbolValue } => entry.value !== undefined
        );

      if (filled.length < 2) {
        continue;
      }

      let hasDuplicate = false;
      const seen = new Map<SymbolValue, CellId>();

      for (const { cellId, value } of filled) {
        const prior = seen.get(value);

        if (prior) {
          conflicts.push({ cells: [prior, cellId], constraintId: 'chain' });
          hasDuplicate = true;
          continue;
        }

        seen.set(value, cellId);
      }

      if (hasDuplicate) {
        continue;
      }

      const valuesInChain = filled.map(({ value }) => value);
      const min = Math.min(...valuesInChain);
      const max = Math.max(...valuesInChain);

      if (max - min >= chainDef.cells.length) {
        conflicts.push({
          cells: filled.map(({ cellId }) => cellId),
          constraintId: 'chain',
        });
      }
    }

    return conflicts;
  },
  permits(values, cellId, value, model) {
    for (const chainDef of getChains(model)) {
      if (!chainDef.cells.includes(cellId)) {
        continue;
      }

      const peerValues = chainDef.cells
        .filter((entry) => entry !== cellId)
        .map((entry) => values.get(entry))
        .filter((entry): entry is SymbolValue => entry !== undefined);

      if (peerValues.includes(value)) {
        return false;
      }

      const rangeValues = [...peerValues, value];
      const min = Math.min(...rangeValues);
      const max = Math.max(...rangeValues);

      if (max - min >= chainDef.cells.length) {
        return false;
      }
    }

    return true;
  },
};
