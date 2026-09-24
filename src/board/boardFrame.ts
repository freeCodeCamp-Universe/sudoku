import type { BoardLayout, GutterSlots } from '@/engine/types';
import type { Size } from '@/board/boardTypes';
import { boardFrameWidth, GUTTER_SIZE } from '@/board/layouts/cellSizes';

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
