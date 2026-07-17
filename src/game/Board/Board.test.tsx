import { describe, expect, it, should } from 'vitest';
import { render, screen } from '@testing-library/react';
import { buildModel } from '@/engine/buildModel';
import { gridCells } from '@/engine/grid';
import type { Cell as CellType, CellId, Values } from '@/engine/types';
import type { BoardProps } from '@/game/Board/Board';
import type { GutterCell, GutterSlots } from '@/game/gameTypes';
import { gridLayout } from '@/game/layouts/grid';
import { multigridLayout } from '@/game/layouts/multigrid';
import { butterfly } from '@/variants/butterfly';
import { killer } from '@/variants/killer';
import { samurai } from '@/variants/samurai';
import { Board } from './Board';
import { isBoxBoundary } from './boxBoundary';

const shouldAssert = should();
const classicVariant = {
  id: 'classic',
  name: 'Classic Sudoku',
  description: 'Test variant.',
  popularity: 0,
  difficulty: 'intermediate' as const,
  layout: { kind: 'grid' as const, size: 9, box: { rows: 3, cols: 3 } },
  symbols: [1, 2, 3, 4, 5, 6, 7, 8, 9],
  constraintIds: [],
};

function makeBoardProps(
  base: Pick<BoardProps, 'variant' | 'cells' | 'rects' | 'size'>,
  overrides: Partial<BoardProps> = {}
): BoardProps {
  return {
    ...base,
    grid: {
      cellState: (_id: CellId) => ({
        candidates: [],
        given: false,
        selected: false,
        conflict: false,
      }),
      cellProps: (id: CellId) => ({ 'data-cell': id, onClick: () => {} }),
      describeCell: (id: CellId) => id,
      announcerRef: { current: null },
      announce: () => {},
      announceCellState: (_id: CellId, _nextValues: Values) => {},
      announceCandidateToggle: () => {},
      moveSelection: () => {},
    },
    renderSymbol: (value) => String(value),
    ...overrides,
  };
}

function makeClassicBoardProps(overrides: Partial<BoardProps> = {}): BoardProps {
  const cells: CellType[] = gridCells(9);

  return makeBoardProps(
    {
      variant: classicVariant,
      cells,
      rects: gridLayout.cellRects(classicVariant),
      size: gridLayout.canvasSize(classicVariant),
    },
    overrides
  );
}

function getRenderedCell(id: CellId): HTMLElement {
  const cell = screen
    .getAllByRole('gridcell')
    .find((gridCell) => gridCell.getAttribute('data-cell') === id);

  shouldAssert.exist(cell);

  if (!cell) {
    throw new Error(`Missing cell ${id}`);
  }

  return cell;
}

function makeButterflyBoardProps(overrides: Partial<BoardProps> = {}): BoardProps {
  const model = buildModel(butterfly);

  return makeBoardProps(
    {
      variant: butterfly,
      cells: model.cells,
      rects: multigridLayout.cellRects(butterfly),
      size: multigridLayout.canvasSize(butterfly),
    },
    overrides
  );
}

function makeSamuraiBoardProps(overrides: Partial<BoardProps> = {}): BoardProps {
  const model = buildModel(samurai);

  return makeBoardProps(
    {
      variant: samurai,
      cells: model.cells,
      rects: multigridLayout.cellRects(samurai),
      size: multigridLayout.canvasSize(samurai),
    },
    overrides
  );
}

function makeKillerBoardProps(overrides: Partial<BoardProps> = {}): BoardProps {
  const cells: CellType[] = gridCells(9);

  return makeBoardProps(
    {
      variant: killer,
      cells,
      rects: gridLayout.cellRects(killer),
      size: gridLayout.canvasSize(killer),
    },
    overrides
  );
}

describe('Board', () => {
  it('should render a grid element with aria-label', () => {
    render(<Board {...makeClassicBoardProps()} />);

    expect(screen.getByRole('grid', { name: /sudoku grid/i })).toBeTruthy();
  });

  it('should render 81 gridcells for a 9x9 board', () => {
    render(<Board {...makeClassicBoardProps()} />);

    expect(screen.getAllByRole('gridcell')).toHaveLength(81);
  });

  it('should render overlay nodes when provided', () => {
    render(
      <Board
        {...makeClassicBoardProps({
          overlays: [
            <div key="overlay" data-testid="overlay">
              overlay
            </div>,
          ],
        })}
      />
    );

    expect(screen.getByTestId('overlay')).toBeTruthy();
  });

  it('should mark 3x3 box boundaries on classic cells', () => {
    render(<Board {...makeClassicBoardProps()} />);
    const cells = screen.getAllByRole('gridcell');

    expect(cells[2]).toHaveAttribute('data-box-right', 'true');
    expect(cells[18]).toHaveAttribute('data-box-bottom', 'true');
  });

  it('should expose row and column metadata for a classic board', () => {
    render(<Board {...makeClassicBoardProps()} />);

    const grid = screen.getByRole('grid', { name: /sudoku grid/i });
    const rows = screen.getAllByRole('row');
    const cells = screen.getAllByRole('gridcell');

    expect(grid).toBeTruthy();
    shouldAssert.equal(grid.getAttribute('aria-rowcount'), '9');
    shouldAssert.equal(grid.getAttribute('aria-colcount'), '9');
    shouldAssert.equal(rows.length, 9);
    shouldAssert.equal(cells.length, 81);

    rows.forEach((row, index) => {
      shouldAssert.equal(row.getAttribute('aria-rowindex'), String(index + 1));
    });

    cells.forEach((cell) => {
      shouldAssert.exist(cell.getAttribute('aria-colindex'));
    });
  });

  it('should expose row ownership metadata for a butterfly board', () => {
    render(<Board {...makeButterflyBoardProps()} />);

    const grid = screen.getByRole('grid', { name: /sudoku grid/i });
    const rows = screen.getAllByRole('row');
    const cells = screen.getAllByRole('gridcell');

    expect(grid).toBeTruthy();
    shouldAssert.equal(grid.getAttribute('aria-rowcount'), '12');
    shouldAssert.equal(grid.getAttribute('aria-colcount'), '12');
    shouldAssert.equal(rows.length, 12);
    shouldAssert.equal(cells.length, 144);

    rows.forEach((row, index) => {
      shouldAssert.equal(row.getAttribute('aria-rowindex'), String(index + 1));
    });

    cells.forEach((cell) => {
      shouldAssert.exist(cell.getAttribute('aria-colindex'));
    });
  });

  it('should only mark internal 3x3 boundaries for a samurai board', () => {
    render(<Board {...makeSamuraiBoardProps()} />);

    expect(getRenderedCell('r8c0')).not.toHaveAttribute('data-box-bottom');
    expect(getRenderedCell('r0c8')).not.toHaveAttribute('data-box-right');
    expect(getRenderedCell('r8c8')).toHaveAttribute('data-box-bottom', 'true');
    expect(getRenderedCell('r8c8')).toHaveAttribute('data-box-right', 'true');
  });

  it('should tag killer cells as caged when the variant uses the cage overlay', () => {
    render(<Board {...makeKillerBoardProps()} />);

    expect(getRenderedCell('r0c0')).toHaveAttribute('data-caged', 'true');
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
    render(<Board {...makeClassicBoardProps({ gutters })} />);

    expect(screen.getByLabelText('Top clue for column 1: 1')).toBeTruthy();
  });

  it('should render start gutter cells when gutters.start is provided', () => {
    const startGutters: GutterCell[] = Array.from({ length: 9 }, (_, index) => ({
      id: `start-${index}`,
      row: index,
      label: String(index + 1),
    }));
    const gutters: GutterSlots = { start: startGutters };
    render(<Board {...makeClassicBoardProps({ gutters })} />);

    expect(screen.getByLabelText('Start clue for row 1: 1')).toBeTruthy();
  });

  it('should not render any gutter wrapper when gutters prop is absent', () => {
    render(<Board {...makeClassicBoardProps()} />);

    expect(screen.queryByLabelText(/clue for /i)).toBeNull();
  });
});

describe('isBoxBoundary', () => {
  it('should suppress triangular right divider on diagonal cells while keeping row divider', () => {
    const triangularVariant: BoardProps['variant'] = {
      ...classicVariant,
      id: 'triangular-test',
      layout: { kind: 'triangular', size: 9 },
    };

    expect(isBoxBoundary(triangularVariant, { id: 'r2c2', row: 2, col: 2 }, 'col')).toBe(false);
    expect(isBoxBoundary(triangularVariant, { id: 'r2c2', row: 2, col: 2 }, 'row')).toBe(true);
    expect(isBoxBoundary(triangularVariant, { id: 'r5c2', row: 5, col: 2 }, 'col')).toBe(true);
    expect(isBoxBoundary(triangularVariant, { id: 'r5c5', row: 5, col: 5 }, 'col')).toBe(false);
  });
});
