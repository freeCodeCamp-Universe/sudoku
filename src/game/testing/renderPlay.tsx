import type { ReactNode } from 'react';
import { renderHook } from '@testing-library/react';
import type { Variant } from '@/engine/types';
import { useGameContext } from '@/game/GameContext';
import { GameProvider } from '@/game/GameProvider';
import { useSudokuGrid } from '@/game/useSudokuGrid';
import { makeFixture, type Fixture } from './makeFixture';

interface PlayOptions {
  seed?: number;
  checkEnabled?: boolean;
}

/**
 * Wires the real reducer (GameProvider) into the real derivation hook
 * (useSudokuGrid) so a test can dispatch gameplay actions and then read the
 * resulting per-cell state. This is the play path the UI uses, minus the
 * canvas render: dispatch -> state.values -> validate -> CellState.
 */
function usePlay(checkEnabled: boolean) {
  const { state, dispatch, model, givens, solution } = useGameContext();
  const grid = useSudokuGrid({
    cells: model.cells,
    model,
    values: state.values,
    candidates: state.candidates,
    givens: new Set(givens.keys()),
    revealed: state.revealed,
    solution,
    onEnterValue: () => {},
    onToggleCandidate: () => {},
    checkEnabled,
  });

  return { state, dispatch, cellState: grid.cellState };
}

export function renderPlay(variant: Variant, { seed = 1, checkEnabled = false }: PlayOptions = {}) {
  const fixture = makeFixture(variant, seed);

  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <GameProvider
        variant={variant}
        model={fixture.model}
        givens={fixture.givens}
        solution={fixture.solution}
      >
        {children}
      </GameProvider>
    );
  }

  const { result } = renderHook(() => usePlay(checkEnabled), { wrapper: Wrapper });

  return { result, fixture };
}

export type { Fixture };
