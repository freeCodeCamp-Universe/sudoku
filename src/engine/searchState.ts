import type { CellId, SymbolValue, Values, VariantModel } from './types';

interface SearchState {
  cellIds: CellId[];
  cellHouses: Map<CellId, number[]>;
  houseValues: Array<Set<SymbolValue>>;
  extraPermits: VariantModel['constraints'];
}

function buildCellHouses(model: VariantModel): Map<CellId, number[]> {
  const cellHouses = new Map<CellId, number[]>();

  model.houses.forEach((house, houseIndex) => {
    house.cells.forEach((cellId) => {
      const houses = cellHouses.get(cellId) ?? [];
      houses.push(houseIndex);
      cellHouses.set(cellId, houses);
    });
  });

  return cellHouses;
}

export function createSearchState(model: VariantModel, values: Values): SearchState {
  const cellHouses = buildCellHouses(model);
  const houseValues = model.houses.map(() => new Set<SymbolValue>());

  for (const [cellId, value] of values) {
    for (const houseIndex of cellHouses.get(cellId) ?? []) {
      houseValues[houseIndex].add(value);
    }
  }

  return {
    cellIds: model.cells.map((cell) => cell.id),
    cellHouses,
    houseValues,
    extraPermits: model.constraints.filter((constraint) => constraint.id !== 'uniqueness'),
  };
}

export function assignValue(
  state: SearchState,
  values: Values,
  cellId: CellId,
  value: SymbolValue
): void {
  values.set(cellId, value);

  for (const houseIndex of state.cellHouses.get(cellId) ?? []) {
    state.houseValues[houseIndex].add(value);
  }
}

export function unassignValue(
  state: SearchState,
  values: Values,
  cellId: CellId,
  value: SymbolValue
): void {
  values.delete(cellId);

  for (const houseIndex of state.cellHouses.get(cellId) ?? []) {
    state.houseValues[houseIndex].delete(value);
  }
}

export function candidatesForCell(
  state: SearchState,
  values: Values,
  model: VariantModel,
  cellId: CellId
): SymbolValue[] {
  const houseIndexes = state.cellHouses.get(cellId) ?? [];

  return model.symbols.filter((value) => {
    if (houseIndexes.some((houseIndex) => state.houseValues[houseIndex].has(value))) {
      return false;
    }

    return state.extraPermits.every((constraint) =>
      constraint.permits ? constraint.permits(values, cellId, value, model) : true
    );
  });
}

export function pickNextCell(
  state: SearchState,
  values: Values,
  model: VariantModel,
  orderCandidates?: (candidates: SymbolValue[]) => SymbolValue[]
): { cellId: CellId | null; candidates: SymbolValue[] } {
  let nextCellId: CellId | null = null;
  let nextEstimate: number | null = null;

  for (const cellId of state.cellIds) {
    if (values.has(cellId)) {
      continue;
    }

    const usedValues = new Set<SymbolValue>();

    for (const houseIndex of state.cellHouses.get(cellId) ?? []) {
      for (const value of state.houseValues[houseIndex]) {
        usedValues.add(value);
      }
    }

    const estimate = model.symbols.length - usedValues.size;

    if (estimate === 0) {
      return { cellId: null, candidates: [] };
    }

    if (nextEstimate === null || estimate < nextEstimate) {
      nextCellId = cellId;
      nextEstimate = estimate;

      if (estimate === 1) {
        break;
      }
    }
  }

  if (nextCellId === null) {
    return { cellId: null, candidates: [] };
  }

  const candidates = candidatesForCell(state, values, model, nextCellId);

  if (candidates.length === 0) {
    return { cellId: null, candidates: [] };
  }

  return {
    cellId: nextCellId,
    candidates: orderCandidates ? orderCandidates(candidates) : candidates,
  };
}
