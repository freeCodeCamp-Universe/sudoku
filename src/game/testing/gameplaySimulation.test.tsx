import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import type { CellId } from '@/engine/types';
import { classic } from '@/variants/classic';
import { makeFixture } from './makeFixture';
import { renderGame } from './GameHarness';

const SEED = 9;

function firstNonGivenCell(): CellId {
  const fixture = makeFixture(classic, SEED);
  const cell = fixture.model.cells.find(({ id }) => !fixture.givens.has(id));

  if (!cell) {
    throw new Error('Expected a non-given cell');
  }

  return cell.id;
}

function firstGivenCell(): CellId {
  const fixture = makeFixture(classic, SEED);
  const cell = fixture.model.cells.find(({ id }) => fixture.givens.has(id));

  if (!cell) {
    throw new Error('Expected a given cell');
  }

  return cell.id;
}

describe('gameplay simulation', () => {
  it('should place a value into an empty cell and record history', async () => {
    const user = userEvent.setup();
    const cell = firstNonGivenCell();

    renderGame(classic, cell, SEED);
    await user.click(screen.getByRole('button', { name: 'enter' }));

    expect(screen.getByTestId('value')).toHaveTextContent('5');
    expect(screen.getByTestId('history')).toHaveTextContent('1');
  });

  it('should revert the last placement on undo', async () => {
    const user = userEvent.setup();
    const cell = firstNonGivenCell();

    renderGame(classic, cell, SEED);
    await user.click(screen.getByRole('button', { name: 'enter' }));
    await user.click(screen.getByRole('button', { name: 'undo' }));

    expect(screen.getByTestId('value')).toHaveTextContent('');
  });

  it('should not modify a given cell on enter', async () => {
    const user = userEvent.setup();
    const cell = firstGivenCell();
    const fixture = makeFixture(classic, SEED);
    const expectedValue = String(fixture.givens.get(cell));

    renderGame(classic, cell, SEED);
    await user.click(screen.getByRole('button', { name: 'enter' }));

    expect(screen.getByTestId('value')).toHaveTextContent(expectedValue);
    expect(screen.getByTestId('history')).toHaveTextContent('0');
  });

  it('should set a cell to its solution value on reveal', async () => {
    const user = userEvent.setup();
    const cell = firstNonGivenCell();
    const fixture = makeFixture(classic, SEED);

    renderGame(classic, cell, SEED);
    await user.click(screen.getByRole('button', { name: 'reveal' }));

    expect(screen.getByTestId('value')).toHaveTextContent(String(fixture.solution.get(cell)));
  });

  it('should mark the board solved when every non-given cell is filled correctly', async () => {
    const user = userEvent.setup();
    const cell = firstNonGivenCell();

    renderGame(classic, cell, SEED);
    await user.click(screen.getByRole('button', { name: 'solve all' }));

    expect(screen.getByTestId('solved')).toHaveTextContent('true');
  });
});
