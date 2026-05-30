import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { gridLayout } from '@/game/layouts/grid';
import { sudokuX } from '@/variants/sudoku-x';
import { DiagonalOverlay } from './DiagonalOverlay';

const rects = gridLayout.cellRects(sudokuX);

describe('DiagonalOverlay', () => {
  it('should render without crashing', () => {
    render(<DiagonalOverlay rects={rects} structure={undefined} />);

    expect(screen.getByTestId('diagonal-overlay')).toBeTruthy();
  });

  it('should render two diagonal line elements', () => {
    render(<DiagonalOverlay rects={rects} structure={undefined} />);

    expect(screen.getAllByTestId('diagonal-line')).toHaveLength(2);
  });
});
