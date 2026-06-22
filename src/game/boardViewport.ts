import type { Rect, Size } from '@/game/gameTypes';

export interface Transform {
  scale: number;
  translateX: number;
  translateY: number;
}

export const COMFORTABLE_CELL_SIZE = 40;
export const MAX_SCALE = 2;

export function isOversized(board: Size, viewport: Size): boolean {
  return board.w > viewport.w || board.h > viewport.h;
}

export function fitScale(board: Size, viewport: Size): number {
  return Math.min(viewport.w / board.w, viewport.h / board.h);
}

export function clampScale(scale: number, board: Size, viewport: Size): number {
  const min = fitScale(board, viewport);
  return Math.min(MAX_SCALE, Math.max(min, scale));
}

// Clamp one axis: center when the scaled board is smaller than the viewport,
// otherwise keep the board from being dragged off-screen.
function clampAxis(translate: number, boardExtent: number, viewportExtent: number, scale: number) {
  const scaled = boardExtent * scale;
  if (scaled <= viewportExtent) {
    return (viewportExtent - scaled) / 2;
  }
  const min = viewportExtent - scaled;
  return Math.min(0, Math.max(min, translate));
}

export function clampTranslate(t: Transform, board: Size, viewport: Size) {
  return {
    translateX: clampAxis(t.translateX, board.w, viewport.w, t.scale),
    translateY: clampAxis(t.translateY, board.h, viewport.h, t.scale),
  };
}

export function zoomAbout(
  t: Transform,
  nextScale: number,
  focus: { x: number; y: number },
  board: Size,
  viewport: Size
): Transform {
  const scale = clampScale(nextScale, board, viewport);
  // Keep the board point under `focus` fixed: focus = translate + boardPoint * scale.
  const boardX = (focus.x - t.translateX) / t.scale;
  const boardY = (focus.y - t.translateY) / t.scale;
  const candidate: Transform = {
    scale,
    translateX: focus.x - boardX * scale,
    translateY: focus.y - boardY * scale,
  };
  return { scale, ...clampTranslate(candidate, board, viewport) };
}

export function minimapPointToTranslate(
  point: { x: number; y: number },
  minimap: Size,
  board: Size,
  viewport: Size,
  scale: number
) {
  const boardX = point.x * (board.w / minimap.w);
  const boardY = point.y * (board.h / minimap.h);
  const candidate: Transform = {
    scale,
    translateX: viewport.w / 2 - boardX * scale,
    translateY: viewport.h / 2 - boardY * scale,
  };
  return clampTranslate(candidate, board, viewport);
}

export function indicatorRect(t: Transform, board: Size, viewport: Size, minimap: Size): Rect {
  const sx = minimap.w / board.w;
  const sy = minimap.h / board.h;
  return {
    x: (-t.translateX / t.scale) * sx,
    y: (-t.translateY / t.scale) * sy,
    w: (viewport.w / t.scale) * sx,
    h: (viewport.h / t.scale) * sy,
  };
}

export function ensureVisibleTranslate(cell: Rect, t: Transform, board: Size, viewport: Size) {
  const left = t.translateX + cell.x * t.scale;
  const right = t.translateX + (cell.x + cell.w) * t.scale;
  const top = t.translateY + cell.y * t.scale;
  const bottom = t.translateY + (cell.y + cell.h) * t.scale;

  let translateX = t.translateX;
  let translateY = t.translateY;

  if (left < 0) translateX -= left;
  else if (right > viewport.w) translateX -= right - viewport.w;
  if (top < 0) translateY -= top;
  else if (bottom > viewport.h) translateY -= bottom - viewport.h;

  return clampTranslate({ ...t, translateX, translateY }, board, viewport);
}
