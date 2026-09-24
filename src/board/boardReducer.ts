import type { CellId, SymbolValue, Values } from '@/engine/types';

export interface HistoryEntry {
  values: Values;
  candidates: Map<CellId, SymbolValue[]>;
  revealed: Set<CellId>;
}

export interface BoardState {
  values: Values;
  candidates: Map<CellId, SymbolValue[]>;
  history: HistoryEntry[];
  revealed: Set<CellId>;
}

export type BoardAction =
  | { type: 'enterValue'; cellId: CellId; value: SymbolValue | 0 }
  | { type: 'toggleCandidate'; cellId: CellId; value: SymbolValue }
  | { type: 'erase'; cellId: CellId }
  | { type: 'clearAll' }
  | { type: 'undo' }
  | { type: 'reveal'; cellId: CellId; solutionValue: SymbolValue };

function cloneCandidates(candidates: Map<CellId, SymbolValue[]>): Map<CellId, SymbolValue[]> {
  return new Map([...candidates.entries()].map(([cellId, values]) => [cellId, [...values]]));
}

function snapshotState(state: BoardState): HistoryEntry {
  return {
    values: new Map(state.values),
    candidates: cloneCandidates(state.candidates),
    revealed: new Set(state.revealed),
  };
}

export function createBoardState(givens: Values): BoardState {
  return {
    values: new Map(givens),
    candidates: new Map(),
    history: [],
    revealed: new Set(),
  };
}

export function boardReducer(state: BoardState, action: BoardAction, givens: Values): BoardState {
  const givenSet = new Set(givens.keys());

  switch (action.type) {
    case 'enterValue': {
      if (givenSet.has(action.cellId) || state.revealed.has(action.cellId)) {
        return state;
      }

      const nextValues = new Map(state.values);
      const nextCandidates = cloneCandidates(state.candidates);

      if (action.value === 0) {
        if (state.values.has(action.cellId)) {
          nextValues.delete(action.cellId);
        } else {
          nextCandidates.delete(action.cellId);
        }
      } else {
        nextValues.set(action.cellId, action.value);
      }

      return {
        ...state,
        values: nextValues,
        candidates: nextCandidates,
        history: [...state.history, snapshotState(state)],
      };
    }
    case 'toggleCandidate': {
      if (
        givenSet.has(action.cellId) ||
        state.revealed.has(action.cellId) ||
        state.values.has(action.cellId)
      ) {
        return state;
      }

      const cellCandidates = new Set(state.candidates.get(action.cellId) ?? []);

      if (cellCandidates.has(action.value)) {
        cellCandidates.delete(action.value);
      } else {
        cellCandidates.add(action.value);
      }

      const nextCandidates = cloneCandidates(state.candidates);
      nextCandidates.set(
        action.cellId,
        [...cellCandidates].sort((left, right) => left - right)
      );

      return {
        ...state,
        candidates: nextCandidates,
      };
    }
    case 'erase': {
      if (givenSet.has(action.cellId) || state.revealed.has(action.cellId)) {
        return state;
      }

      if (!state.values.has(action.cellId) && !state.candidates.has(action.cellId)) {
        return state;
      }

      const nextValues = new Map(state.values);
      const nextCandidates = cloneCandidates(state.candidates);

      if (state.values.has(action.cellId)) {
        nextValues.delete(action.cellId);
      } else {
        nextCandidates.delete(action.cellId);
      }

      return {
        ...state,
        values: nextValues,
        candidates: nextCandidates,
        history: [...state.history, snapshotState(state)],
      };
    }
    case 'clearAll': {
      const clearedValues = new Map(state.values);
      const clearedCandidates = cloneCandidates(state.candidates);
      for (const cellId of clearedValues.keys()) {
        if (!givenSet.has(cellId)) {
          clearedValues.delete(cellId);
        }
      }
      for (const cellId of clearedCandidates.keys()) {
        if (!givenSet.has(cellId)) clearedCandidates.delete(cellId);
      }
      return {
        ...state,
        values: clearedValues,
        candidates: clearedCandidates,
        revealed: new Set(),
        history: [...state.history, snapshotState(state)],
      };
    }
    case 'undo': {
      const previous = state.history[state.history.length - 1];

      if (!previous) {
        return state;
      }

      return {
        ...state,
        values: new Map(previous.values),
        candidates: cloneCandidates(previous.candidates),
        revealed: new Set(previous.revealed),
        history: state.history.slice(0, -1),
      };
    }
    case 'reveal': {
      if (givenSet.has(action.cellId) || state.revealed.has(action.cellId)) {
        return state;
      }

      const nextValues = new Map(state.values);
      const nextCandidates = cloneCandidates(state.candidates);
      const nextRevealed = new Set(state.revealed);

      nextValues.set(action.cellId, action.solutionValue);
      nextCandidates.delete(action.cellId);
      nextRevealed.add(action.cellId);

      return {
        ...state,
        values: nextValues,
        candidates: nextCandidates,
        revealed: nextRevealed,
        history: [...state.history, snapshotState(state)],
      };
    }
  }
}
