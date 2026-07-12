import type { BoardLayout } from '@/engine/types';
import type { GutterSlots, Rect, Size } from '@/game/gameTypes';
import { boardFrameWidth, GUTTER_SIZE } from './layouts/cellSizes';

export interface Transform {
  scale: number;
  translateX: number;
  translateY: number;
}

export const COMFORTABLE_CELL_SIZE = 40;
export const MAX_SCALE = 2;

// Each zoom-button tap scales by 1.5×, so an oversized board goes from its
// fitted view (scale ≈ 0.35–0.45 on a 320px viewport) to MAX_SCALE in 3–4
// taps. Buttons stay coarse on purpose: pinch gestures cover fine-grained
// adjustment and Fit is a one-tap reset.
export const BUTTON_ZOOM_FACTOR = 1.5;

// The rendered grid draws its frame border outside the cell canvas
// (content-box border in Board.module.css), so the board the viewport clips
// is one border wider than the canvas on each side. Multigrid and triangular
// layouts draw their outer edges inside the canvas and add nothing.
export function boardFrameEdge(layoutKind: BoardLayout['kind'], highContrast: boolean): number {
  if (layoutKind === 'multigrid' || layoutKind === 'triangular') {
    return 0;
  }
  return boardFrameWidth(highContrast) / 2;
}

// The full rendered extent of the board: cell canvas plus the frame border on
// each side. Pan/zoom and minimap math must use this, not the bare canvas
// size, or the fit scale leaves the end-side borders past the clip.
export function framedBoardSize(canvas: Size, frameEdge: number): Size {
  return { w: canvas.w + frameEdge * 2, h: canvas.h + frameEdge * 2 };
}

// Clue gutters (skyscraper/sandwich) render outside the framed board: a
// gutter column or matching corner on both inline sides, and a clue track
// above/below only when those clues exist. The viewport must pan and fit
// this full extent, not just the framed canvas.
export function gutteredBoardSize(framed: Size, gutters: GutterSlots | undefined): Size {
  if (!gutters) {
    return framed;
  }
  return {
    w: framed.w + 2 * GUTTER_SIZE,
    h: framed.h + (gutters.top ? GUTTER_SIZE : 0) + (gutters.bottom ? GUTTER_SIZE : 0),
  };
}

// Offset from the gutter layout's origin to the framed grid's border-box
// corner: the start gutter column (or corner) inline, the top clue track (if
// any) block-wise. Cell rects are canvas-relative, so ensure-visible math
// must add this plus the frame edge.
export function gutterOrigin(gutters: GutterSlots | undefined): { x: number; y: number } {
  if (!gutters) {
    return { x: 0, y: 0 };
  }
  return { x: GUTTER_SIZE, y: gutters.top ? GUTTER_SIZE : 0 };
}

// Tolerance for the oversized comparison. When the frame is shrink-to-fit
// around the board (the desktop layout) the two sizes are nominally equal,
// and getBoundingClientRect can report the frame a fraction of a pixel
// smaller under fractional zoom / DPR rounding. Without slack the comparison
// sits on that equality boundary and flickers the pan/zoom clip on and off.
const OVERSIZED_TOLERANCE = 0.5;

export function isOversized(board: Size, viewport: Size): boolean {
  return board.w > viewport.w + OVERSIZED_TOLERANCE || board.h > viewport.h + OVERSIZED_TOLERANCE;
}

export function fitScale(board: Size, viewport: Size): number {
  return Math.min(viewport.w / board.w, viewport.h / board.h);
}

// The scale at which the whole board is visible: fit scale for oversized
// boards, natural size (1) for boards that already fit — a fitting board
// should never be blown up past its designed cell size just to fill the frame.
export function fitWholeScale(board: Size, viewport: Size): number {
  return Math.min(1, fitScale(board, viewport));
}

export function clampScale(scale: number, board: Size, viewport: Size): number {
  const min = fitWholeScale(board, viewport);
  return Math.min(MAX_SCALE, Math.max(min, scale));
}

// Clamp one axis. When the scaled board is smaller than the viewport, any
// position that keeps the whole board inside is allowed — so centering a
// focus point can pull the board off-center without cropping it, and the
// camera stays continuous as zooming carries the board across the
// board-equals-viewport boundary (pinning to center below that boundary
// makes the anchor lurch from board center to focus point in one step).
// When the board is larger, keep it from being dragged off-screen.
function clampAxis(translate: number, boardExtent: number, viewportExtent: number, scale: number) {
  const scaled = boardExtent * scale;
  if (scaled <= viewportExtent) {
    return Math.min(viewportExtent - scaled, Math.max(0, translate));
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

// Center a board-space point in the viewport at the given scale, clamped so
// the board is never cropped needlessly: near an edge (or while the scaled
// board is smaller than the viewport) the point lands as close to center as
// keeping the board fully in frame allows — the bounded-camera behavior
// standard in maps and 2D games.
export function centerOnPoint(
  point: { x: number; y: number },
  scale: number,
  board: Size,
  viewport: Size
): Transform {
  const candidate: Transform = {
    scale,
    translateX: viewport.w / 2 - point.x * scale,
    translateY: viewport.h / 2 - point.y * scale,
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
  const boardPoint = {
    x: point.x * (board.w / minimap.w),
    y: point.y * (board.h / minimap.h),
  };
  const { translateX, translateY } = centerOnPoint(boardPoint, scale, board, viewport);
  return { translateX, translateY };
}

// Clamped to the minimap bounds: when the viewport is larger than the scaled
// board (a board that fits), the raw visible slice extends past the board, and
// the indicator should just cover the whole map.
export function indicatorRect(t: Transform, board: Size, viewport: Size, minimap: Size): Rect {
  const sx = minimap.w / board.w;
  const sy = minimap.h / board.h;
  const x = Math.max(0, (-t.translateX / t.scale) * sx);
  const y = Math.max(0, (-t.translateY / t.scale) * sy);
  return {
    x,
    y,
    w: Math.min(minimap.w - x, (viewport.w / t.scale) * sx),
    h: Math.min(minimap.h - y, (viewport.h / t.scale) * sy),
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
