import { render, screen } from '@testing-library/react';
import { describe, expect, it, should } from 'vitest';
import type { CellId } from '@/engine/types';
import { buildModel } from '@/engine/buildModel';
import { Board } from '@/game/Board';
import { multigridLayout } from '@/game/layouts/multigrid';
import { butterfly } from './butterfly';

const shouldAssert = should();

function getCell(id: CellId): HTMLElement {
  const cell = screen
    .getAllByRole('gridcell')
    .find((gridCell) => gridCell.getAttribute('data-cell') === id);

  shouldAssert.exist(cell);

  if (!cell) {
    throw new Error(`Missing cell ${id}`);
  }

  return cell;
}

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
          announce: () => {},
        }}
        renderSymbol={(value) => String(value)}
      />
    );

    expect(screen.getAllByRole('gridcell')).toHaveLength(144);
  });

  it('should mark the overlapping box boundaries, including the central cross', () => {
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
          announce: () => {},
        }}
        renderSymbol={(value) => String(value)}
      />
    );

    const rightAtThree = getCell('r0c2');
    const rightAtNine = getCell('r0c8');
    const noRightAtEdge = getCell('r0c11');
    const bottomAtNine = getCell('r8c0');
    const noBottomAtEdge = getCell('r11c0');

    expect(rightAtThree).toHaveAttribute('data-box-right', 'true');
    expect(rightAtNine).toHaveAttribute('data-box-right', 'true');
    expect(bottomAtNine).toHaveAttribute('data-box-bottom', 'true');
    shouldAssert.equal(noRightAtEdge.hasAttribute('data-box-right'), false);
    shouldAssert.equal(noBottomAtEdge.hasAttribute('data-box-bottom'), false);
  });
});
