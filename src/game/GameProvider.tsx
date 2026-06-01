import { useMemo, useReducer } from 'react';
import type { CellId, SymbolValue, Values, Variant, VariantModel } from '@/engine/types';
import { GameContext, type GameAction, type GameState, type HistoryEntry } from './GameContext';

interface GameProviderProps {
  variant: Variant;
  model: VariantModel;
  givens: Values;
  solution: Values;
  children: React.ReactNode;
}

function cloneCandidates(candidates: Map<CellId, SymbolValue[]>): Map<CellId, SymbolValue[]> {
  return new Map(
    [...candidates.entries()].map(([cellId, values]) => [cellId, [...values]])
  );
}

function snapshotState(state: GameState): HistoryEntry {
  return {
    values: new Map(state.values),
    candidates: cloneCandidates(state.candidates),
    revealed: new Set(state.revealed),
  };
}

function isSolved(values: Values, solution: Values): boolean {
  if (values.size !== solution.size) {
    return false;
  }

  for (const [cellId, value] of solution) {
    if (values.get(cellId) !== value) {
      return false;
    }
  }

  return true;
}

function createInitialState(givens: Values, solution: Values): GameState {
  const values = new Map(givens);

  return {
    values,
    candidates: new Map(),
    history: [],
    elapsedSeconds: 0,
    solved: isSolved(values, solution),
    revealed: new Set(),
    timerStarted: false,
  };
}

function createReducer(initialGivens: Values, solution: Values) {
  const givenSet = new Set(initialGivens.keys());

  return function reducer(state: GameState, action: GameAction): GameState {
    switch (action.type) {
      case 'enterValue': {
        if (givenSet.has(action.cellId) || state.revealed.has(action.cellId)) {
          return state;
        }

        const nextValues = new Map(state.values);
        const nextCandidates = cloneCandidates(state.candidates);

        if (action.value === 0) {
          nextValues.delete(action.cellId);
        } else {
          nextValues.set(action.cellId, action.value);
        }

        nextCandidates.delete(action.cellId);

        return {
          ...state,
          values: nextValues,
          candidates: nextCandidates,
          history: [...state.history, snapshotState(state)],
          solved: isSolved(nextValues, solution),
          timerStarted: true,
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
          [...cellCandidates].sort((left, right) => left - right) as SymbolValue[]
        );

        return {
          ...state,
          candidates: nextCandidates,
          timerStarted: true,
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
        nextValues.delete(action.cellId);
        nextCandidates.delete(action.cellId);

        return {
          ...state,
          values: nextValues,
          candidates: nextCandidates,
          history: [...state.history, snapshotState(state)],
          solved: isSolved(nextValues, solution),
        };
      }
      case 'clearAll': {
        const clearedValues = new Map(state.values);
        const clearedCandidates = cloneCandidates(state.candidates);
        for (const cellId of clearedValues.keys()) {
          if (!givenSet.has(cellId) && !state.revealed.has(cellId)) {
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
          history: [...state.history, snapshotState(state)],
          solved: false,
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
          solved: isSolved(previous.values, solution),
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
          solved: isSolved(nextValues, solution),
        };
      }
      case 'tick':
        return state.solved ? state : { ...state, elapsedSeconds: state.elapsedSeconds + 1 };
      case 'newGame':
        return createInitialState(initialGivens, solution);
      default:
        return state;
    }
  };
}

export function GameProvider({ variant, model, givens, solution, children }: GameProviderProps) {
  const reducer = useMemo(() => createReducer(givens, solution), [givens, solution]);
  const [state, dispatch] = useReducer(reducer, undefined, () => createInitialState(givens, solution));

  return (
    <GameContext.Provider value={{ state, dispatch, variant, model, givens, solution }}>
      {children}
    </GameContext.Provider>
  );
}
