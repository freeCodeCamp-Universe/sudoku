import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { gridCells } from '@/engine/grid';
import type { Cell as CellType, CellId } from '@/engine/types';
import type { BoardProps } from '@/game/Board/Board';
import { gridLayout } from '@/game/layouts/grid';
import { Board } from './Board';

const classicVariant = {
  id: 'classic',
  name: 'Classic Sudoku',
  difficulty: 'intermediate' as const,
  layout: { kind: 'grid' as const, size: 9, box: { rows: 3, cols: 3 } },
  symbols: [1, 2, 3, 4, 5, 6, 7, 8, 9],
  constraintIds: [],
};

function makeBoardProps(overrides: Partial<BoardProps> = {}): BoardProps {
  const cells: CellType[] = gridCells(9);
  const rects = gridLayout.cellRects(classicVariant);
  const size = gridLayout.canvasSize(classicVariant);

  return {
    cells,
    rects,
    size,
    grid: {
      cellState: (_id: CellId) => ({
        candidates: [],
        given: false,
        selected: false,
        conflict: false,
      }),
      cellProps: (id: CellId) => ({ 'data-cell': id, onClick: () => {} }),
      announcerRef: { current: null },
    },
    renderSymbol: (value) => String(value),
    ...overrides,
  };
}

describe('Board', () => {
  it('should render a grid element with aria-label', () => {
    render(<Board {...makeBoardProps()} />);

    expect(screen.getByRole('grid', { name: /sudoku grid/i })).toBeTruthy();
  });

  it('should render 81 gridcells for a 9x9 board', () => {
    render(<Board {...makeBoardProps()} />);

    expect(screen.getAllByRole('gridcell')).toHaveLength(81);
  });

  it('should render overlay nodes when provided', () => {
    render(<Board {...makeBoardProps({ overlays: [<div key="overlay" data-testid="overlay">overlay</div>] })} />);

    expect(screen.getByTestId('overlay')).toBeTruthy();
  });
});
