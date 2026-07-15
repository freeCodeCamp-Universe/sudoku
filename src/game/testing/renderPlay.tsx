import type { ReactNode } from 'react';
import { renderHook } from '@testing-library/react';
import type { Variant } from '@/engine/types';
import { withStructure } from '@/game/assemblePuzzle';
import { useGameContext } from '@/game/GameContext';
import { GameProvider } from '@/game/GameProvider';
import { useSudokuGrid } from '@/game/useSudokuGrid';
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

  return { state, dispatch, cellState: grid.cellState, moveSelection: grid.moveSelection };
}

export function renderPlay(
  variant: Variant,
  { seed = 1, checkEnabled = false, fixture: providedFixture }: PlayOptions = {}
) {
  const fixture = providedFixture ?? makeFixture(variant, seed);
  // Mirror GamePage's Phase 2 merge so the derived structure (cages, kropki
  // marks, edge clues, ...) rides on the model and validate() runs the special
  // constraints. Reuse the fixture's structure rather than re-deriving — some
  // variants (killer) carve it non-deterministically, so a fresh derivation
  // would not match the violation the caller already located.
  const model = withStructure(fixture.model, fixture.structure);

  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <GameProvider
        variant={variant}
        model={model}
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
