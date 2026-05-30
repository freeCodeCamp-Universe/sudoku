import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { render, screen } from '@testing-library/react';
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

    expect(screen.getAllByLabelText(/Top clue for column /i)).toHaveLength(9);
    expect(screen.getAllByLabelText(/Start clue for row /i)).toHaveLength(9);
  });
});
