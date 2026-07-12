/**
 * Single home for the board cell-size numbers. Layout strategies express
 * their `baseCellSize` in terms of these constants, and the responsive
 * policy in `useResponsiveCellSize` picks a fitted step from CELL_SIZE_STEPS.
 * Never write a cell-size literal in a layout or the hook.
 */

/** Default cell size for boards with no space pressure (9x9, 4x4, triangular). */
export const CELL_SIZE_STANDARD = 52;

/** Cell size for mid-density boards (12-col multigrids like Butterfly). */
export const CELL_SIZE_ROOMY = 40;

/** Cell size for dense boards (16x16 grid, 21/15-col multigrids like Samurai). */
export const CELL_SIZE_COMPACT = 30;

/**
 * Multigrid fallback for canvas widths without a dedicated size:
 * cells are sized so the canvas is at most this many px wide.
 */
export const MULTIGRID_MAX_CANVAS_WIDTH = 400;

/**
 * Structural line width (px): the board frame border and box boundaries.
 * Mirrors --box-boundary-width in src/app/layers.css (default and
 * .high-contrast values); cellSizes.test.ts fails if the two drift apart.
 */
export const BOX_BOUNDARY_WIDTH = 3;
export const BOX_BOUNDARY_WIDTH_HIGH_CONTRAST = 5;

/** Total inline frame around the board canvas (one border per side). */
export function boardFrameWidth(highContrast: boolean): number {
  return 2 * (highContrast ? BOX_BOUNDARY_WIDTH_HIGH_CONTRAST : BOX_BOUNDARY_WIDTH);
}

/**
 * Cross-axis size (px) of a clue gutter (skyscraper/sandwich edge clues):
 * the width of the start/end gutter columns and corners, and the height of
 * the top/bottom clue tracks. Mirrors the .gutterCorner width in
 * src/game/Board/Board.module.css; cellSizes.test.ts fails if they drift.
 */
export const GUTTER_SIZE = 40;

/**
 * Cell-size ladder for boards under viewport pressure, largest first.
 * The responsive policy picks the largest step (capped at the layout's base
 * size) whose canvas plus frame fits the current viewport bucket's floor, so
 * a board never overflows any viewport in its bucket down to the 320px
 * baseline. See docs/superpowers/plans/2026-06-23-mobile-9x9-fit.md.
 */
export const CELL_SIZE_STEPS = [CELL_SIZE_STANDARD, 44, 38, 34] as const;

/**
 * Viewport bucket floors (px), largest first: the guaranteed minimum width
 * per device class (320 baseline, 360 small phones, 414 large phones, 520
 * phablet and up). Fitted cell sizes are computed against the floor of the
 * current viewport's bucket, so the size is stable across each bucket
 * instead of changing on every resize pixel.
 */
export const VIEWPORT_BUCKET_FLOORS = [520, 414, 360, 320] as const;

/**
 * Viewport at/above which oversized boards (16×16, multigrids) render at their
 * true base size; below it they use the comfortable size for panning.
 */
export const VIEWPORT_DESKTOP = 1024;
