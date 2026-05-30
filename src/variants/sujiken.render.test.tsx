import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { CellId } from '@/engine/types';
import { buildModel } from '@/engine/buildModel';
import { Board } from '@/game/Board';
import { triangularLayout } from '@/game/layouts/triangular';
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
        }}
        renderSymbol={(value) => String(value)}
      />
    );

    expect(screen.getAllByRole('gridcell')).toHaveLength(45);
  });
});
