import { createContext, useContext } from 'react';
import type { Dispatch } from 'react';
import type { CellId, SymbolValue, Values, Variant, VariantModel } from '@/engine/types';

export interface HistoryEntry {
  values: Values;
  candidates: Map<CellId, SymbolValue[]>;
  revealed: Set<CellId>;
}

export interface GameState {
  values: Values;
  candidates: Map<CellId, SymbolValue[]>;
  history: HistoryEntry[];
  elapsedSeconds: number;
  solved: boolean;
  revealed: Set<CellId>;
  timerStarted: boolean;
}

export type GameAction =
  | { type: 'enterValue'; cellId: CellId; value: SymbolValue | 0 }
  | { type: 'toggleCandidate'; cellId: CellId; value: SymbolValue }
  | { type: 'erase'; cellId: CellId }
  | { type: 'clearAll' }
  | { type: 'undo' }
  | { type: 'reveal'; cellId: CellId; solutionValue: SymbolValue }
  | { type: 'tick' }
  | { type: 'newGame' };

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
