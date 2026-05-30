import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { CellId } from '@/engine/types';
import { buildModel } from '@/engine/buildModel';
import { Board } from '@/game/Board';
import { multigridLayout } from '@/game/layouts/multigrid';
import { butterfly } from './butterfly';

describe('Butterfly Board renders correct cell count', () => {
  it('should render 144 gridcells', () => {
    const model = buildModel(butterfly);
    const rects = multigridLayout.cellRects(butterfly);
    const size = multigridLayout.canvasSize(butterfly);

    render(
      <Board
        variant={butterfly}
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

    expect(screen.getAllByRole('gridcell')).toHaveLength(144);
  });
});
