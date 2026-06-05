import { shuffle } from './grid';
import { assignValue, createSearchState, pickNextCell, unassignValue } from './searchState';
import type { CellId, Solution, SymbolValue, Values, VariantModel } from './types';

export function solve(model: VariantModel, given: Values, opts: { max?: number } = {}): Solution[] {
  const max = opts.max ?? 1;

  if (model.constraints.some((constraint) => constraint.conflicts(given, model).length > 0)) {
    return [];
  }

  return searchCore(model, new Map(given), { max }).solutions;
}

export function hasUniqueSolution(
  model: VariantModel,
  given: Values,
  opts: { nodeBudget?: number } = {}
): boolean {
  if (model.constraints.some((constraint) => constraint.conflicts(given, model).length > 0)) {
    return false;
  }

  const result = searchCore(model, new Map(given), {
    max: 2,
    nodeBudget: opts.nodeBudget,
  });

  return !result.aborted && result.solutions.length === 1;
}

export function findSolution(
  model: VariantModel,
  given: Values,
  rng?: () => number
): Solution | null {
  if (model.constraints.some((constraint) => constraint.conflicts(given, model).length > 0)) {
    return null;
  }

  const result = searchCore(model, new Map(given), { max: 1, rng });

  return result.solutions[0] ?? null;
}

interface SearchCoreOptions {
  max: number;
  nodeBudget?: number;
  rng?: () => number;
}

interface SearchCoreResult {
  solutions: Solution[];
  aborted: boolean;
}

function searchCore(model: VariantModel, values: Values, opts: SearchCoreOptions): SearchCoreResult {
  if (model.constraints.every((constraint) => constraint.id === 'uniqueness')) {
    return searchWithUniquenessPropagation(model, values, opts);
  }

  return searchWithPermits(model, values, opts);
}

function searchWithPermits(
  model: VariantModel,
  values: Values,
  opts: SearchCoreOptions
): SearchCoreResult {
  const solutions: Solution[] = [];
  const state = createSearchState(model, values);
  let aborted = false;
  let visitedNodes = 0;

  function backtrack(): void {
    if (aborted || solutions.length >= opts.max) {
      return;
    }

    if (opts.nodeBudget !== undefined && visitedNodes >= opts.nodeBudget) {
      aborted = true;
      return;
    }

    visitedNodes += 1;
    const { cellId, candidates } = pickNextCell(state, values, model);

    if (cellId === null) {
      if (candidates.length === 0 && values.size !== model.cells.length) {
        return;
      }

      solutions.push(new Map(values));
      return;
    }

    for (const value of candidates) {
      assignValue(state, values, cellId, value);
      backtrack();
      unassignValue(state, values, cellId, value);

      if (aborted || solutions.length >= opts.max) {
        return;
      }
    }
  }

  backtrack();
  return { solutions, aborted };
}

interface PropagationData {
  cellIds: CellId[];
  cellIndexById: Map<CellId, number>;
  symbolToBit: Map<SymbolValue, number>;
  symbolsByBitIndex: SymbolValue[];
  houseCells: number[][];
  houseSupportsHiddenSingle: boolean[];
  housesByCell: number[][];
  peersByCell: number[][];
  fullMask: number;
}

function searchWithUniquenessPropagation(
  model: VariantModel,
  values: Values,
  opts: SearchCoreOptions
): SearchCoreResult {
  const propagation = createPropagationData(model);
  const candidates = new Array<number>(propagation.cellIds.length).fill(propagation.fullMask);
  const solutions: Solution[] = [];
  let aborted = false;
  let visitedNodes = 0;

  for (const [cellId, value] of values) {
    const cellIndex = propagation.cellIndexById.get(cellId);
    const bit = propagation.symbolToBit.get(value);
    if (cellIndex === undefined || bit === undefined) {
      return { solutions: [], aborted: false };
    }

    if (!assignCandidate(candidates, cellIndex, bit, propagation)) {
      return { solutions: [], aborted: false };
    }
  }

  function backtrack(currentCandidates: number[]): void {
    if (aborted || solutions.length >= opts.max) {
      return;
    }

    if (opts.nodeBudget !== undefined && visitedNodes >= opts.nodeBudget) {
      aborted = true;
      return;
    }

    visitedNodes += 1;
    const { nextCellIndex, contradiction } = selectNextCellByMask(currentCandidates);
    if (contradiction) {
      return;
    }

    if (nextCellIndex === null) {
      solutions.push(candidatesToSolution(currentCandidates, propagation));
      return;
    }

    const branchBits: number[] = [];
    let branchMask = currentCandidates[nextCellIndex];
    while (branchMask !== 0) {
      const bit = branchMask & -branchMask;
      branchMask &= branchMask - 1;
      branchBits.push(bit);
    }

    // Without an rng the bits stay in ascending order, keeping solve/uniqueness
    // results deterministic. With one, the branch order is shuffled so blank-grid
    // solving yields a varied solution per seed (used for puzzle generation).
    const orderedBits = opts.rng ? shuffle(branchBits, opts.rng) : branchBits;

    for (const bit of orderedBits) {
      const nextCandidates = currentCandidates.slice();
      if (!assignCandidate(nextCandidates, nextCellIndex, bit, propagation)) {
        continue;
      }

      backtrack(nextCandidates);
      if (aborted || solutions.length >= opts.max) {
        return;
      }
    }
  }

  backtrack(candidates);
  return { solutions, aborted };
}

function createPropagationData(model: VariantModel): PropagationData {
  const cellIds = model.cells.map((cell) => cell.id);
  const cellIndexById = new Map<CellId, number>(cellIds.map((cellId, index) => [cellId, index]));
  const symbolToBit = new Map<SymbolValue, number>();

  model.symbols.forEach((symbol, index) => {
    symbolToBit.set(symbol, 1 << index);
  });

  const houseCells = model.houses.map((house) =>
    house.cells
      .map((cellId) => cellIndexById.get(cellId))
      .filter((cellIndex): cellIndex is number => cellIndex !== undefined)
  );
  const housesByCell: number[][] = Array.from({ length: cellIds.length }, () => []);
  const houseSupportsHiddenSingle = houseCells.map(
    (houseCellIndexes) => houseCellIndexes.length === model.symbols.length
  );

  houseCells.forEach((cells, houseIndex) => {
    for (const cellIndex of cells) {
      housesByCell[cellIndex].push(houseIndex);
    }
  });

  const peersByCell = housesByCell.map((houseIndexes, cellIndex) => {
    const peerSet = new Set<number>();

    for (const houseIndex of houseIndexes) {
      for (const houseCellIndex of houseCells[houseIndex]) {
        if (houseCellIndex !== cellIndex) {
          peerSet.add(houseCellIndex);
        }
      }
    }

    return [...peerSet];
  });

  return {
    cellIds,
    cellIndexById,
    symbolToBit,
    symbolsByBitIndex: [...model.symbols],
    houseCells,
    houseSupportsHiddenSingle,
    housesByCell,
    peersByCell,
    fullMask: (1 << model.symbols.length) - 1,
  };
}

function assignCandidate(
  candidates: number[],
  cellIndex: number,
  bit: number,
  propagation: PropagationData
): boolean {
  const mask = candidates[cellIndex];
  if ((mask & bit) === 0) {
    return false;
  }

  let otherBits = mask & ~bit;
  while (otherBits !== 0) {
    const otherBit = otherBits & -otherBits;
    otherBits &= otherBits - 1;
    if (!eliminateCandidate(candidates, cellIndex, otherBit, propagation)) {
      return false;
    }
  }

  return true;
}

function eliminateCandidate(
  candidates: number[],
  cellIndex: number,
  bit: number,
  propagation: PropagationData
): boolean {
  const mask = candidates[cellIndex];
  if ((mask & bit) === 0) {
    return true;
  }

  const nextMask = mask & ~bit;
  if (nextMask === 0) {
    return false;
  }

  candidates[cellIndex] = nextMask;

  if (isSingleCandidate(nextMask)) {
    const forcedBit = nextMask;
    for (const peerIndex of propagation.peersByCell[cellIndex]) {
      if (!eliminateCandidate(candidates, peerIndex, forcedBit, propagation)) {
        return false;
      }
    }
  }

  for (const houseIndex of propagation.housesByCell[cellIndex]) {
    if (!propagation.houseSupportsHiddenSingle[houseIndex]) {
      continue;
    }

    let candidateCount = 0;
    let lastCellIndex = -1;

    for (const houseCellIndex of propagation.houseCells[houseIndex]) {
      if ((candidates[houseCellIndex] & bit) !== 0) {
        candidateCount += 1;
        lastCellIndex = houseCellIndex;
        if (candidateCount > 1) {
          break;
        }
      }
    }

    if (candidateCount === 0) {
      return false;
    }

    if (candidateCount === 1 && !assignCandidate(candidates, lastCellIndex, bit, propagation)) {
      return false;
    }
  }

  return true;
}

function isSingleCandidate(mask: number): boolean {
  return (mask & (mask - 1)) === 0;
}

function countBits(mask: number): number {
  let count = 0;
  let bitset = mask;
  while (bitset !== 0) {
    bitset &= bitset - 1;
    count += 1;
  }
  return count;
}

function selectNextCellByMask(candidates: number[]): {
  nextCellIndex: number | null;
  contradiction: boolean;
} {
  let nextCellIndex: number | null = null;
  let nextCount = Number.POSITIVE_INFINITY;

  for (let index = 0; index < candidates.length; index += 1) {
    const count = countBits(candidates[index]);
    if (count === 0) {
      return { nextCellIndex: null, contradiction: true };
    }

    if (count === 1) {
      continue;
    }

    if (count < nextCount) {
      nextCellIndex = index;
      nextCount = count;
      if (count === 2) {
        break;
      }
    }
  }

  return { nextCellIndex, contradiction: false };
}

function candidatesToSolution(candidates: number[], propagation: PropagationData): Solution {
  const solution: Solution = new Map();

  for (let index = 0; index < candidates.length; index += 1) {
    const mask = candidates[index];
    const bitIndex = Math.log2(mask);
    solution.set(propagation.cellIds[index], propagation.symbolsByBitIndex[bitIndex]);
  }

  return solution;
}
