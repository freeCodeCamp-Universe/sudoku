import { createContext, useContext } from 'react';
import type { Dispatch } from 'react';
import type { BoardAction, BoardState, HistoryEntry } from '@/board/boardReducer';
import type { Values, Variant, VariantModel } from '@/engine/types';

export type { HistoryEntry };

export interface GameState extends BoardState {
  elapsedSeconds: number;
  solved: boolean;
  timerStarted: boolean;
}

export type GameAction = BoardAction | { type: 'tick' } | { type: 'newGame' };

export interface GameContextValue {
  state: GameState;
  dispatch: Dispatch<GameAction>;
  variant: Variant;
  model: VariantModel;
  givens: Values;
  solution: Values;
}

export const GameContext = createContext<GameContextValue | null>(null);

export function useGameContext(): GameContextValue {
  const context = useContext(GameContext);

  if (!context) {
    throw new Error('GameContext is missing');
  }

  return context;
}
