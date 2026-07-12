import type { CellId } from '@/engine/types';
import { BUTTON_ZOOM_FACTOR } from '@/game/boardViewport';
import type { Rect, Size } from '@/game/gameTypes';
import type { BoardViewport } from '@/game/useBoardViewport';
import { ZoomControls } from '@/game/ZoomControls';

interface BoardZoomControlsProps {
  viewport: BoardViewport;
  viewportSize: Size;
  selectedCellId: CellId | null;
  rects: Map<CellId, Rect>;
  frameEdge: number;
}

// Button zoom centers the selected cell so the cell the user is working on
// ends up mid-screen (clamped at the board edges, like a game camera at a
// world bound). With no selection it keeps the board point currently under
// the viewport center, which is plain zoom-about-center.
export function BoardZoomControls({
  viewport,
  viewportSize,
  selectedCellId,
  rects,
  frameEdge,
}: BoardZoomControlsProps) {
  const zoomStep = (factor: number) => {
    const rect = selectedCellId ? rects.get(selectedCellId) : undefined;
    const t = viewport.transform;
    const point = rect
      ? // Cell rects are in canvas coordinates; the viewport's origin is the
        // grid's border-box corner, one frame edge before the canvas.
        { x: frameEdge + rect.x + rect.w / 2, y: frameEdge + rect.y + rect.h / 2 }
      : {
          x: (viewportSize.w / 2 - t.translateX) / t.scale,
          y: (viewportSize.h / 2 - t.translateY) / t.scale,
        };
    viewport.zoomOnPoint(factor, point);
  };

  return (
    <ZoomControls
      onZoomIn={() => zoomStep(BUTTON_ZOOM_FACTOR)}
      onZoomOut={() => zoomStep(1 / BUTTON_ZOOM_FACTOR)}
      onFit={viewport.fitWhole}
    />
  );
}
