import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { CellId } from '@/engine/types';
import { buildModel } from '@/engine/buildModel';
import { Board } from '@/game/Board';
import { triangularLayout } from '@/game/layouts/triangular';
import { renderVariantBoard } from '@/game/testing/renderVariantBoard';
import { sujiken } from './sujiken';

describe('Sujiken Board renders correct cell count', () => {
  it('should render 45 gridcells', () => {
    const model = buildModel(sujiken);
    const rects = triangularLayout.cellRects(sujiken);
    const size = triangularLayout.canvasSize(sujiken);

    render(
      <Board
        variant={sujiken}
        cells={model.cells}
        rects={rects}
        size={size}
        grid={{
          cellState: (_id: CellId) => ({
            candidates: [],
            given: false,
            selected: false,
            conflict: false,
          }),
          cellProps: (id: CellId) => ({ 'data-cell': id, onClick: () => {} }),
          announcerRef: { current: null },
          announce: () => {},
          moveSelection: () => {},
        }}
        renderSymbol={(value) => String(value)}
      />
    );

    expect(screen.getAllByRole('gridcell')).toHaveLength(45);
  });
});

describe('Sujiken Board cell attributes', () => {
  it('should not mark any cell as diagonal', () => {
    const { getCell } = renderVariantBoard(sujiken);

    // Main diagonal cells were previously shaded; they should now be plain
    expect(getCell('r0c0')).not.toHaveAttribute('data-diagonal');
    expect(getCell('r4c4')).not.toHaveAttribute('data-diagonal');
    expect(getCell('r8c8')).not.toHaveAttribute('data-diagonal');
  });

  it('should not apply CSS box boundaries to any cell', () => {
    const { getCell } = renderVariantBoard(sujiken);

    // Region borders are drawn by SujikenOverlay; cells must not carry box-boundary attrs
    expect(getCell('r2c2')).not.toHaveAttribute('data-box-right');
    expect(getCell('r2c0')).not.toHaveAttribute('data-box-bottom');
    expect(getCell('r5c5')).not.toHaveAttribute('data-box-right');
    expect(getCell('r5c0')).not.toHaveAttribute('data-box-bottom');
  });

  it('should render the sujiken overlay', () => {
    renderVariantBoard(sujiken);

    expect(screen.getByTestId('sujiken-overlay')).toBeTruthy();
  });
});
