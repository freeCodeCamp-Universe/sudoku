import { useCallback, useMemo, useState } from 'react';
import type { Rect, Size } from '@/game/gameTypes';
import {
  centerOnPoint,
  clampScale,
  clampTranslate,
  ensureVisibleTranslate,
  fitWholeScale,
  minimapPointToTranslate,
  zoomAbout,
  type Transform,
} from './boardViewport';

export interface BoardViewport {
  transform: Transform;
  // True when the last change was programmatic (button zoom, minimap seek,
  // ensure-visible) rather than a direct gesture, so the view eases to the
  // new transform instead of jumping. Gestures must track the pointer
  // immediately and always reset this to false.
  animated: boolean;
  panBy(dx: number, dy: number): void;
  zoomBy(factor: number, focus?: { x: number; y: number }): void;
  zoomOnPoint(factor: number, point: { x: number; y: number }): void;
  fitWhole(): void;
  panToMinimapPoint(point: { x: number; y: number }, minimap: Size): void;
  ensureVisible(cell: Rect): void;
}

const ORIGIN: Transform = { scale: 1, translateX: 0, translateY: 0 };

// The fitted view: whole board visible (fit scale for oversized boards,
// natural size otherwise), centered explicitly — the clamp allows any
// fully-visible position, so centering is this function's own job. Falls
// back to the origin while the viewport is still unmeasured (0×0) so the
// scale never collapses to 0.
function fitWholeTransform(board: Size, viewport: Size): Transform {
  if (viewport.w <= 0 || viewport.h <= 0) {
    return ORIGIN;
  }
  const scale = fitWholeScale(board, viewport);
  return {
    scale,
    translateX: (viewport.w - board.w * scale) / 2,
    translateY: (viewport.h - board.h * scale) / 2,
  };
}

export function useBoardViewport(board: Size, viewport: Size): BoardViewport {
  // `null` means the user hasn't panned or zoomed yet: the effective transform
  // is derived as the fitted view, so the board opens fully visible and stays
  // fitted through measurement updates and resizes until the first gesture.
  const [explicit, setExplicit] = useState<Transform | null>(null);
  const [animated, setAnimated] = useState(false);
  const transform = explicit ?? fitWholeTransform(board, viewport);

  const panBy = useCallback(
    (dx: number, dy: number) => {
      setAnimated(false);
      setExplicit((prev) => {
        const t = prev ?? fitWholeTransform(board, viewport);
        const candidate = { ...t, translateX: t.translateX + dx, translateY: t.translateY + dy };
        return { scale: t.scale, ...clampTranslate(candidate, board, viewport) };
      });
    },
    [board, viewport]
  );

  const zoomBy = useCallback(
    (factor: number, focus?: { x: number; y: number }) => {
      const center = focus ?? { x: viewport.w / 2, y: viewport.h / 2 };
      setAnimated(false);
      setExplicit((prev) => {
        const t = prev ?? fitWholeTransform(board, viewport);
        return zoomAbout(t, t.scale * factor, center, board, viewport);
      });
    },
    [board, viewport]
  );

  // Zoom while centering a board-space point (e.g. the selected cell),
  // clamped to the board bounds so no empty space shows past an edge.
  const zoomOnPoint = useCallback(
    (factor: number, point: { x: number; y: number }) => {
      setAnimated(true);
      setExplicit((prev) => {
        const t = prev ?? fitWholeTransform(board, viewport);
        const scale = clampScale(t.scale * factor, board, viewport);
        return centerOnPoint(point, scale, board, viewport);
      });
    },
    [board, viewport]
  );

  const fitWhole = useCallback(() => {
    setAnimated(true);
    setExplicit(null);
  }, []);

  const panToMinimapPoint = useCallback(
    (point: { x: number; y: number }, minimap: Size) => {
      setAnimated(true);
      setExplicit((prev) => {
        const t = prev ?? fitWholeTransform(board, viewport);
        return {
          scale: t.scale,
          ...minimapPointToTranslate(point, minimap, board, viewport, t.scale),
        };
      });
    },
    [board, viewport]
  );

  const ensureVisible = useCallback(
    (cell: Rect) => {
      setAnimated(true);
      setExplicit((prev) => {
        const t = prev ?? fitWholeTransform(board, viewport);
        return { ...t, ...ensureVisibleTranslate(cell, t, board, viewport) };
      });
    },
    [board, viewport]
  );

  return useMemo(
    () => ({
      transform,
      animated,
      panBy,
      zoomBy,
      zoomOnPoint,
      fitWhole,
      panToMinimapPoint,
      ensureVisible,
    }),
    [transform, animated, panBy, zoomBy, zoomOnPoint, fitWhole, panToMinimapPoint, ensureVisible]
  );
}
