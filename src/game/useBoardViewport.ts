import { useCallback, useMemo, useState } from 'react';
import type { Rect, Size } from '@/game/gameTypes';
import {
  clampScale,
  clampTranslate,
  ensureVisibleTranslate,
  fitScale,
  minimapPointToTranslate,
  zoomAbout,
  type Transform,
} from './boardViewport';

export interface BoardViewport {
  transform: Transform;
  panBy(dx: number, dy: number): void;
  zoomBy(factor: number, focus?: { x: number; y: number }): void;
  fitWhole(): void;
  reset(): void;
  panToMinimapPoint(point: { x: number; y: number }, minimap: Size): void;
  ensureVisible(cell: Rect): void;
}

const ORIGIN: Transform = { scale: 1, translateX: 0, translateY: 0 };

export function useBoardViewport(board: Size, viewport: Size): BoardViewport {
  const [transform, setTransform] = useState<Transform>(ORIGIN);

  const panBy = useCallback(
    (dx: number, dy: number) => {
      setTransform((t) => {
        const candidate = { ...t, translateX: t.translateX + dx, translateY: t.translateY + dy };
        return { scale: t.scale, ...clampTranslate(candidate, board, viewport) };
      });
    },
    [board, viewport]
  );

  const zoomBy = useCallback(
    (factor: number, focus?: { x: number; y: number }) => {
      const center = focus ?? { x: viewport.w / 2, y: viewport.h / 2 };
      setTransform((t) => zoomAbout(t, t.scale * factor, center, board, viewport));
    },
    [board, viewport]
  );

  const fitWhole = useCallback(() => {
    setTransform((t) => {
      const scale = clampScale(fitScale(board, viewport), board, viewport);
      return { scale, ...clampTranslate({ ...t, scale }, board, viewport) };
    });
  }, [board, viewport]);

  const reset = useCallback(() => {
    setTransform({ scale: 1, ...clampTranslate(ORIGIN, board, viewport) });
  }, [board, viewport]);

  const panToMinimapPoint = useCallback(
    (point: { x: number; y: number }, minimap: Size) => {
      setTransform((t) => ({
        scale: t.scale,
        ...minimapPointToTranslate(point, minimap, board, viewport, t.scale),
      }));
    },
    [board, viewport]
  );

  const ensureVisible = useCallback(
    (cell: Rect) => {
      setTransform((t) => ({ ...t, ...ensureVisibleTranslate(cell, t, board, viewport) }));
    },
    [board, viewport]
  );

  return useMemo(
    () => ({ transform, panBy, zoomBy, fitWhole, reset, panToMinimapPoint, ensureVisible }),
    [transform, panBy, zoomBy, fitWhole, reset, panToMinimapPoint, ensureVisible]
  );
}
