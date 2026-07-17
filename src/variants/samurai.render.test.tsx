import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { CellId } from '@/engine/types';
import { buildModel } from '@/engine/buildModel';
import { Board } from '@/game/Board';
import { multigridLayout } from '@/game/layouts/multigrid';
import { samurai } from './samurai';

describe('Samurai Board renders correct cell count', () => {
  it('should render 369 gridcells', () => {
    const model = buildModel(samurai);
    const rects = multigridLayout.cellRects(samurai);
    const size = multigridLayout.canvasSize(samurai);

    render(
      <Board
        variant={samurai}
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
          describeCell: (id: CellId) => id,
          announcerRef: { current: null },
          announce: () => {},
          announceCellState: () => {},
          announceCandidateToggle: () => {},
          moveSelection: () => {},
        }}
        renderSymbol={(value) => String(value)}
      />
    );

    expect(screen.getAllByRole('gridcell')).toHaveLength(369);
  });
});
