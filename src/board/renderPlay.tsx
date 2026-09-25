import { renderHook } from '@testing-library/react';
import { useReducer } from 'react';
import type { Variant } from '@/engine/types';
import { withStructure } from '@/board/assemblePuzzle';
import { boardReducer, createBoardState } from '@/board/boardReducer';
import type { BoardAction } from '@/board/boardReducer';
import { useSudokuGrid } from '@/board/useSudokuGrid';
import { makeFixture, type Fixture } from './makeFixture';

interface PlayOptions {
  seed?: number;
  checkEnabled?: boolean;
  // Reuse a pre-built fixture instead of generating one. Required when the
  // caller has already inspected the fixture (e.g. to find a violating move),
  // since some variants derive their structure non-deterministically and a
  // fresh makeFixture would not reproduce it.
  fixture?: Fixture;
}

/**
 * Wires the real board reducer into the real derivation hook
 * (useSudokuGrid) so a test can dispatch gameplay actions and then read the
 * resulting per-cell state. This is the play path the UI uses, minus the
 * canvas render: dispatch -> state.values -> validate -> CellState.
 */
function usePlay(fixture: Fixture, checkEnabled: boolean) {
  const [state, dispatch] = useReducer(
    (currentState: ReturnType<typeof createBoardState>, action: BoardAction) =>
      boardReducer(currentState, action, fixture.givens),
    fixture.givens,
    createBoardState
  );
  const grid = useSudokuGrid({
    cells: fixture.model.cells,
    model: withStructure(fixture.model, fixture.structure),
    values: state.values,
    candidates: state.candidates,
    givens: new Set(fixture.givens.keys()),
    revealed: state.revealed,
    solution: fixture.solution,
    onEnterValue: () => {},
    onToggleCandidate: () => {},
    checkEnabled,
  });

  return { state, dispatch, cellState: grid.cellState, moveSelection: grid.moveSelection };
}

export function renderPlay(
  variant: Variant,
  { seed = 1, checkEnabled = false, fixture: providedFixture }: PlayOptions = {}
) {
  const fixture = providedFixture ?? makeFixture(variant, seed);
  const { result } = renderHook(() => usePlay(fixture, checkEnabled));

  return { result, fixture };
}

export type { Fixture };
