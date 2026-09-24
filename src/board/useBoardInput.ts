import { useCallback } from 'react';
import type { CellId, SymbolValue, Values } from '@/engine/types';
import type { BoardAction, BoardState } from './boardReducer';
import type { GridInteraction } from './boardTypes';

type BoardInputState = Pick<BoardState, 'values' | 'candidates'>;
type BoardInputAnnouncements = Pick<
  GridInteraction,
  'announceCellState' | 'announceErase' | 'announceCandidateToggle'
>;

interface UseBoardInputOptions {
  state: BoardInputState;
  solution: Values;
  dispatch: (action: BoardAction) => void;
  candidateMode: boolean;
  checkEnabled: boolean;
  inputLocked?: boolean;
}

export function useBoardInput({
  state,
  solution,
  dispatch,
  candidateMode,
  checkEnabled,
  inputLocked = false,
}: UseBoardInputOptions) {
  const onEnterValue = useCallback(
    (cellId: CellId, value: SymbolValue | 0) => {
      if (inputLocked) {
        return;
      }
      dispatch({ type: 'enterValue', cellId, value });
    },
    [dispatch, inputLocked]
  );

  const onToggleCandidate = useCallback(
    (cellId: CellId, value: SymbolValue) => {
      if (inputLocked) {
        return;
      }
      dispatch({ type: 'toggleCandidate', cellId, value });
    },
    [dispatch, inputLocked]
  );

  const handleNumberEntry = useCallback(
    (
      value: SymbolValue | 0,
      selectedCellId: CellId | null,
      announcements: BoardInputAnnouncements
    ) => {
      if (inputLocked || !selectedCellId) {
        return;
      }

      const isCorrectlyFilled =
        checkEnabled &&
        solution.has(selectedCellId) &&
        state.values.get(selectedCellId) === solution.get(selectedCellId);

      if (isCorrectlyFilled) {
        return;
      }

      if (value === 0) {
        dispatch({ type: 'erase', cellId: selectedCellId });
        const nextValues = new Map(state.values);
        nextValues.delete(selectedCellId);
        const nextCandidates = new Map(state.candidates);
        if (!state.values.has(selectedCellId)) {
          nextCandidates.delete(selectedCellId);
        }
        announcements.announceErase(selectedCellId, nextCandidates);
        return;
      }

      if (candidateMode) {
        const current = state.candidates.get(selectedCellId) ?? [];
        const adding = !current.includes(value);
        onToggleCandidate(selectedCellId, value);
        announcements.announceCandidateToggle(selectedCellId, value, adding);
        return;
      }

      onEnterValue(selectedCellId, value);
      const nextValues = new Map(state.values);
      nextValues.set(selectedCellId, value);
      announcements.announceCellState(selectedCellId, nextValues);
    },
    [
      candidateMode,
      checkEnabled,
      dispatch,
      inputLocked,
      onEnterValue,
      onToggleCandidate,
      solution,
      state.candidates,
      state.values,
    ]
  );

  return { onEnterValue, onToggleCandidate, handleNumberEntry };
}
