import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { MiniPreview } from './MiniPreview';

vi.mock('@/engine/generate', async () => {
  const actual = await vi.importActual<typeof import('@/engine/generate')>('@/engine/generate');

  return {
    ...actual,
    generate(model: import('@/engine/types').VariantModel) {
      const solution = new Map(
        model.cells.map((cell, index) => [cell.id, (index % model.symbols.length) + 1])
      );
      const givens = new Map(
        model.cells
          .filter((_, index) => index % 2 === 0)
          .map((cell, index) => [cell.id, (index % model.symbols.length) + 1])
      );

      return { solution, givens };
    },
  };
});

describe('MiniPreview', () => {
  it('should render a Board for the classic variant without crashing', () => {
    render(<MiniPreview variantId="classic" />);

    expect(screen.getByRole('grid', { hidden: true, name: /sudoku grid/i })).toBeTruthy();
  });

  it('should render cells as given with no selection or conflict state', () => {
    render(<MiniPreview variantId="classic" />);

    const cells = screen.getAllByRole('gridcell', { hidden: true });

    expect(cells.some((cell) => cell.hasAttribute('data-selected'))).toBe(false);
    expect(cells.some((cell) => cell.hasAttribute('data-conflict'))).toBe(false);
    expect(cells.some((cell) => cell.getAttribute('aria-readonly') === 'true')).toBe(true);
  });

  it('should render variant-specific symbols for the color preview', () => {
    render(<MiniPreview variantId="color" />);

    expect(screen.getAllByTestId('cell-color-chip').length).toBeGreaterThan(0);
  });

  it('should render variant-specific gutters for the skyscraper preview', () => {
    render(<MiniPreview variantId="skyscraper" />);

    expect(
      screen.getAllByText(
        (_content, node) => node?.getAttribute('aria-label')?.startsWith('Top clue for column ') ?? false
      ).length
    ).toBeGreaterThan(0);
    expect(
      screen.getAllByText(
        (_content, node) => node?.getAttribute('aria-label')?.startsWith('Start clue for row ') ?? false
      ).length
    ).toBeGreaterThan(0);
  });
});
