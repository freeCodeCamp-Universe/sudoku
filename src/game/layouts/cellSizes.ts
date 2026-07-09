/**
 * Single home for the board cell-size numbers. Layout strategies express
 * their `baseCellSize` in terms of these constants, and the responsive
 * policy in `useResponsiveCellSize` shrinks relative to CELL_SIZE_STANDARD.
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

/** Viewport widths (px) at which cells shrink below their base size. */
export const VIEWPORT_SMALL = 520;
export const VIEWPORT_NARROW = 375;

/**
 * What CELL_SIZE_STANDARD shrinks to at each viewport step. Other base
 * sizes scale by the same ratio (e.g. 44 / 52 of their base).
 */
export const CELL_SIZE_STANDARD_SMALL = 44;
export const CELL_SIZE_STANDARD_NARROW = 38;
