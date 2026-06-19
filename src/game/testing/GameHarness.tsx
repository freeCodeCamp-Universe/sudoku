import { render, screen } from '@testing-library/react';
import type { CellId, Variant } from '@/engine/types';
import { useGameContext } from '@/game/GameContext';
import { GameProvider } from '@/game/GameProvider';
import { makeFixture } from './makeFixture';

export function renderGame(variant: Variant, cell: CellId, seed = 9) {
  const fixture = makeFixture(variant, seed);

  function Probe({ cell }: { cell: CellId }) {
    const { state, dispatch, model, givens, solution } = useGameContext();

    return (
      <div>
        <div data-testid="value">{String(state.values.get(cell) ?? '')}</div>
        <div data-testid="history">{String(state.history.length)}</div>
        <div data-testid="solved">{String(state.solved)}</div>
        <button
          type="button"
          onClick={() => dispatch({ type: 'enterValue', cellId: cell, value: 5 })}
        >
          enter
        </button>
        <button type="button" onClick={() => dispatch({ type: 'erase', cellId: cell })}>
          erase
        </button>
        <button type="button" onClick={() => dispatch({ type: 'undo' })}>
          undo
        </button>
        <button
          type="button"
          onClick={() =>
            dispatch({ type: 'reveal', cellId: cell, solutionValue: solution.get(cell)! })
          }
        >
          reveal
        </button>
        <button
          type="button"
          onClick={() => {
            for (const nextCell of model.cells) {
              if (!givens.has(nextCell.id)) {
                dispatch({
                  type: 'enterValue',
                  cellId: nextCell.id,
                  value: solution.get(nextCell.id)!,
                });
              }
            }
          }}
        >
          solve all
        </button>
      </div>
    );
  }

  render(
    <GameProvider
      variant={variant}
      model={fixture.model}
      givens={fixture.givens}
      solution={fixture.solution}
    >
      <Probe cell={cell} />
    </GameProvider>
  );

  return {
    givens: fixture.givens,
    solution: fixture.solution,
    screen,
  };
}
