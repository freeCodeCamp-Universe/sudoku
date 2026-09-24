import { useMemo, useReducer } from 'react';
import { boardReducer, createBoardState } from '@/board/boardReducer';
import type { Values, Variant, VariantModel } from '@/engine/types';
import { GameContext, type GameAction, type GameState } from './GameContext';
import type { SavedProgress } from './useProgressPersistence';

interface GameProviderProps {
  variant: Variant;
  model: VariantModel;
  givens: Values;
  solution: Values;
  initialProgress?: SavedProgress | null;
  children: React.ReactNode;
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
  return {
    ...createBoardState(givens),
    elapsedSeconds: 0,
    solved: isSolved(givens, solution),
    timerStarted: false,
  };
}

function createReducer(initialGivens: Values, solution: Values) {
  return function reducer(state: GameState, action: GameAction): GameState {
    if (action.type === 'tick') {
      return state.solved ? state : { ...state, elapsedSeconds: state.elapsedSeconds + 1 };
    }

    if (action.type === 'newGame') {
      return createInitialState(initialGivens, solution);
    }

    const boardState = boardReducer(state, action, initialGivens);
    if (boardState === state) {
      return state;
    }

    return {
      ...state,
      ...boardState,
      solved:
        action.type === 'clearAll'
          ? false
          : action.type === 'enterValue' ||
              action.type === 'erase' ||
              action.type === 'undo' ||
              action.type === 'reveal'
            ? isSolved(boardState.values, solution)
            : state.solved,
      timerStarted:
        action.type === 'enterValue' || action.type === 'toggleCandidate'
          ? true
          : state.timerStarted,
    };
  };
}

function createStateFromProgress(
  givens: Values,
  solution: Values,
  progress: SavedProgress
): GameState {
  const savedValues = new Map(progress.values);
  const values = new Map([...givens, ...savedValues]);
  return {
    values,
    candidates: new Map(progress.candidates),
    history: [],
    elapsedSeconds: progress.elapsedSeconds,
    solved: isSolved(values, solution),
    revealed: new Set(progress.revealed),
    timerStarted: progress.elapsedSeconds > 0,
  };
}

export function GameProvider({
  variant,
  model,
  givens,
  solution,
  initialProgress,
  children,
}: GameProviderProps) {
  const reducer = useMemo(() => createReducer(givens, solution), [givens, solution]);
  const [state, dispatch] = useReducer(reducer, undefined, () =>
    initialProgress
      ? createStateFromProgress(givens, solution, initialProgress)
      : createInitialState(givens, solution)
  );

  return (
    <GameContext.Provider value={{ state, dispatch, variant, model, givens, solution }}>
      {children}
    </GameContext.Provider>
  );
}
