import type { CellId, Conflict, Constraint, VariantModel } from '../types';

const peersByModel = new WeakMap<VariantModel, Map<CellId, CellId[]>>();

function peersFor(model: VariantModel): Map<CellId, CellId[]> {
  const cached = peersByModel.get(model);

  if (cached) {
    return cached;
  }

  const peers = new Map<CellId, Set<CellId>>();

  for (const house of model.houses) {
    for (const cellId of house.cells) {
      const cellPeers = peers.get(cellId) ?? new Set<string>();

      for (const peerId of house.cells) {
        if (peerId !== cellId) {
          cellPeers.add(peerId);
        }
      }

      peers.set(cellId, cellPeers);
    }
  }

  const normalized = new Map(
    [...peers.entries()].map(([cellId, cellPeers]) => [cellId, [...cellPeers]])
  );

  peersByModel.set(model, normalized);

  return normalized;
}

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
    for (const peerId of peersFor(model).get(cellId) ?? []) {
      if (values.get(peerId) === value) {
        return false;
      }
    }

    return true;
  },
};
