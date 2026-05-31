import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { gridCells } from '@/engine/grid';
import type { Cell as CellType, CellId } from '@/engine/types';
import type { BoardProps } from '@/game/Board/Board';
import type { GutterCell, GutterSlots } from '@/game/gameTypes';
import { gridLayout } from '@/game/layouts/grid';
import { Board } from './Board';

const classicVariant = {
  id: 'classic',
  name: 'Classic Sudoku',
  description: 'Test variant.',
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
    variant: classicVariant,
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

  it('should mark 3x3 box boundaries on classic cells', () => {
    render(<Board {...makeBoardProps()} />);
    const cells = screen.getAllByRole('gridcell');

    expect(cells[2]).toHaveAttribute('data-box-right', 'true');
    expect(cells[18]).toHaveAttribute('data-box-bottom', 'true');
  });
});

describe('Board gutter slots', () => {
  it('should render top gutter cells when gutters.top is provided', () => {
    const topGutters: GutterCell[] = Array.from({ length: 9 }, (_, index) => ({
      id: `top-${index}`,
      col: index,
      label: String(index + 1),
    }));
    const gutters: GutterSlots = { top: topGutters };
    render(<Board {...makeBoardProps({ gutters })} />);

    expect(screen.getByLabelText('Top clue for column 1: 1')).toBeTruthy();
  });

  it('should render start gutter cells when gutters.start is provided', () => {
    const startGutters: GutterCell[] = Array.from({ length: 9 }, (_, index) => ({
      id: `start-${index}`,
      row: index,
      label: String(index + 1),
    }));
    const gutters: GutterSlots = { start: startGutters };
    render(<Board {...makeBoardProps({ gutters })} />);

    expect(screen.getByLabelText('Start clue for row 1: 1')).toBeTruthy();
  });

  it('should not render any gutter wrapper when gutters prop is absent', () => {
    render(<Board {...makeBoardProps()} />);

    expect(screen.queryByLabelText(/clue for /i)).toBeNull();
  });
});
