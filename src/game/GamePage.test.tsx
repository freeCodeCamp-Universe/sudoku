import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ThemeProvider } from '@/app/ThemeProvider';
import { gridCells } from '@/engine/grid';
import type { Values } from '@/engine/types';
import { GamePage } from './GamePage';

function makeSolution(): Values {
  return new Map(gridCells(9).map((cell) => [cell.id, ((cell.row * 3 + Math.floor(cell.row / 3) + cell.col) % 9) + 1]));
}

vi.mock('@/engine/generate', () => {
  const solution = makeSolution();

  return {
    generate: () => ({
      solution,
      givens: new Map([...solution.entries()].slice(0, 25)),
    }),
  };
});

function renderGamePage(variantId = 'classic') {
  return render(
    <MemoryRouter initialEntries={[`/${variantId}`]}>
      <ThemeProvider>
        <Routes>
          <Route path="/:variantId" element={<GamePage />} />
        </Routes>
      </ThemeProvider>
    </MemoryRouter>
  );
}

describe('GamePage - Classic integration', () => {
  it('should render the sudoku grid', () => {
    renderGamePage();

    expect(screen.getByRole('grid', { name: /sudoku grid/i })).toBeTruthy();
  });

  it('should render 81 cells', () => {
    renderGamePage();

    expect(screen.getAllByRole('gridcell')).toHaveLength(81);
  });

  it('should render the number pad', () => {
    renderGamePage();

    expect(screen.getByRole('button', { name: '5' })).toBeTruthy();
  });

  it('should render the Reveal Cell button', () => {
    renderGamePage();

    expect(screen.getByRole('button', { name: /reveal/i })).toBeTruthy();
  });

  it('should throw when an unknown variantId is used', () => {
    expect(() => renderGamePage('not-a-variant')).toThrow();
  });

  it('should render the jigsaw variant', () => {
    renderGamePage('jigsaw');

    expect(screen.getByRole('grid', { name: /sudoku grid/i })).toBeTruthy();
    expect(screen.getAllByRole('gridcell')).toHaveLength(81);
  });

  it('should use color names in cell accessibility labels for the color variant', () => {
    renderGamePage('color');

    expect(screen.getByRole('gridcell', { name: /Row 1, column 1, Red, readonly/i })).toBeTruthy();
  });

  it('should render skyscraper gutters from derived structure', () => {
    renderGamePage('skyscraper');

    expect(screen.getAllByLabelText(/visible from the top of column /i)).toHaveLength(9);
    expect(screen.getAllByLabelText(/visible from the start of row /i)).toHaveLength(9);
  });

  it('should render the arrow rule legend for arrow sudoku', () => {
    renderGamePage('arrow');

    expect(screen.getByText('Digits along each arrow sum to the number in the circle.')).toBeTruthy();
    expect(screen.getByLabelText('Arrow rule legend')).toBeTruthy();
  });

  it('should not render the arrow rule legend for non-arrow variants', () => {
    renderGamePage('classic');

    expect(screen.queryByText('Digits along each arrow sum to the number in the circle.')).toBeNull();
  });

  it('should open the help dialog with the current variant help rules', async () => {
    const user = userEvent.setup();

    renderGamePage();
    await user.click(screen.getByRole('button', { name: /how to play/i }));

    expect(screen.getByRole('dialog', { name: 'How to Play' })).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'Basic Rules', level: 3 })).toBeTruthy();
    expect(screen.getByText('The grid:')).toBeTruthy();
    expect(screen.getByText('A 9×9 board divided into nine 3×3 boxes. Fill every cell with a digit from 1 to 9.')).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'Additional Rules', level: 3 })).toBeTruthy();
    expect(screen.getByText('Given digits:')).toBeTruthy();
  });

  it('should render samurai additional rules from the upstream dialog content', async () => {
    const user = userEvent.setup();

    renderGamePage('samurai');
    await user.click(screen.getByRole('button', { name: /how to play/i }));

    expect(screen.getByRole('heading', { name: 'Additional Rules', level: 3 })).toBeTruthy();
    expect(screen.getByText('Shared corners:')).toBeTruthy();
    expect(screen.getByText('Solve as one:')).toBeTruthy();
  });
});
