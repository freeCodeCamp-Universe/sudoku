import { useContext } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { gridCells, standardHouses } from '@/engine/grid';
import type { Variant, VariantModel, Values } from '@/engine/types';
import { GameContext } from './GameContext';
import { GameProvider } from './GameProvider';

const variant: Variant = {
  id: 'classic',
  name: 'Classic Sudoku',
  description: 'Test variant.',
  difficulty: 'intermediate',
  layout: { kind: 'grid', size: 9, box: { rows: 3, cols: 3 } },
  symbols: [1, 2, 3, 4, 5, 6, 7, 8, 9],
  constraintIds: ['uniqueness'],
  overlayIds: [],
  annotatorIds: [],
};

const model: VariantModel = {
  cells: gridCells(9),
  houses: standardHouses(9, { rows: 3, cols: 3 }),
  constraints: [],
  symbols: [1, 2, 3, 4, 5, 6, 7, 8, 9],
};

const solution: Values = new Map(gridCells(9).map((cell) => [cell.id, ((cell.row * 9 + cell.col) % 9) + 1]));

function StateDisplay() {
  const context = useContext(GameContext);

  if (!context) {
    throw new Error('GameContext is missing');
  }

  return (
    <div>
      <span data-testid="value-r0c0">{context.state.values.get('r0c0') ?? 'empty'}</span>
      <span data-testid="history-len">{context.state.history.length}</span>
      <button type="button" onClick={() => context.dispatch({ type: 'enterValue', cellId: 'r0c0', value: 5 })}>
        enter 5
      </button>
      <button type="button" onClick={() => context.dispatch({ type: 'undo' })}>
        undo
      </button>
      <button type="button" onClick={() => context.dispatch({ type: 'erase', cellId: 'r0c0' })}>
        erase
      </button>
    </div>
  );
}

function makeProvider(givens = new Map<string, number>()) {
  return (
    <GameProvider variant={variant} model={model} givens={givens} solution={solution}>
      <StateDisplay />
    </GameProvider>
  );
}

describe('GameProvider', () => {
  it('should initialize with empty values', () => {
    render(makeProvider());

    expect(screen.getByTestId('value-r0c0')).toHaveTextContent('empty');
  });

  it('should enter a value via dispatch', async () => {
    const user = userEvent.setup();

    render(makeProvider());
    await user.click(screen.getByRole('button', { name: 'enter 5' }));

    expect(screen.getByTestId('value-r0c0')).toHaveTextContent('5');
  });

  it('should record history on enterValue', async () => {
    const user = userEvent.setup();

    render(makeProvider());
    await user.click(screen.getByRole('button', { name: 'enter 5' }));

    expect(screen.getByTestId('history-len')).toHaveTextContent('1');
  });

  it('should undo the last enterValue', async () => {
    const user = userEvent.setup();

    render(makeProvider());
    await user.click(screen.getByRole('button', { name: 'enter 5' }));
    await user.click(screen.getByRole('button', { name: 'undo' }));

    expect(screen.getByTestId('value-r0c0')).toHaveTextContent('empty');
  });

  it('should erase a cell value', async () => {
    const user = userEvent.setup();

    render(makeProvider());
    await user.click(screen.getByRole('button', { name: 'enter 5' }));
    await user.click(screen.getByRole('button', { name: 'erase' }));

    expect(screen.getByTestId('value-r0c0')).toHaveTextContent('empty');
  });
});
