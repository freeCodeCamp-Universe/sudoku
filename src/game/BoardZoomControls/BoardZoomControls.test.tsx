import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { CellId } from '@/engine/types';
import { BUTTON_ZOOM_FACTOR } from '@/game/boardViewport';
import type { Rect } from '@/game/gameTypes';
import type { BoardViewport } from '@/game/useBoardViewport';
import { BoardZoomControls } from './BoardZoomControls';

function makeViewport(overrides: Partial<BoardViewport> = {}): BoardViewport {
  return {
    transform: { scale: 1, translateX: 0, translateY: 0 },
    engaged: false,
    animated: false,
    panBy: vi.fn(),
    zoomBy: vi.fn(),
    zoomOnPoint: vi.fn(),
    fitWhole: vi.fn(),
    panToMinimapPoint: vi.fn(),
    ensureVisible: vi.fn(),
    ...overrides,
  };
}

const CELL_ID = 'r0c0' as CellId;
const rects = new Map<CellId, Rect>([[CELL_ID, { x: 10, y: 20, w: 40, h: 40 }]]);
const viewportSize = { w: 320, h: 480 };

describe('BoardZoomControls', () => {
  it('should zoom in on the selected cell center offset by the frame edge', async () => {
    const viewport = makeViewport();
    const user = userEvent.setup();

    render(
      <BoardZoomControls
        viewport={viewport}
        viewportSize={viewportSize}
        selectedCellId={CELL_ID}
        rects={rects}
        frameEdge={4}
      />
    );

    await user.click(screen.getByRole('button', { name: 'Zoom in' }));

    expect(viewport.zoomOnPoint).toHaveBeenCalledWith(BUTTON_ZOOM_FACTOR, { x: 34, y: 44 });
  });

  it('should zoom out about the board point under the viewport center when nothing is selected', async () => {
    const viewport = makeViewport({ transform: { scale: 2, translateX: -100, translateY: -60 } });
    const user = userEvent.setup();

    render(
      <BoardZoomControls
        viewport={viewport}
        viewportSize={viewportSize}
        selectedCellId={null}
        rects={rects}
        frameEdge={4}
      />
    );

    await user.click(screen.getByRole('button', { name: 'Zoom out' }));

    expect(viewport.zoomOnPoint).toHaveBeenCalledWith(1 / BUTTON_ZOOM_FACTOR, {
      x: (viewportSize.w / 2 + 100) / 2,
      y: (viewportSize.h / 2 + 60) / 2,
    });
  });

  it('should fit the whole board when Fit is pressed', async () => {
    const viewport = makeViewport();
    const user = userEvent.setup();

    render(
      <BoardZoomControls
        viewport={viewport}
        viewportSize={viewportSize}
        selectedCellId={null}
        rects={rects}
        frameEdge={4}
      />
    );

    await user.click(screen.getByRole('button', { name: 'Fit whole board' }));

    expect(viewport.fitWhole).toHaveBeenCalledTimes(1);
    expect(viewport.zoomOnPoint).not.toHaveBeenCalled();
  });
});
