import { readThemeColor } from '@/app/readThemeColor';

/**
 * Shared cell-fill colors for the gallery canvas previews, read live from the
 * theme tokens so a preview stays in lockstep with the playable board instead
 * of drifting via hardcoded hex. Only the structural fills the board itself
 * paints belong here; decorative preview chrome (grid hairlines, cage tints,
 * color chips) stays local to each preview.
 */

/** Empty-cell fill — matches the board's plain cell background per theme. */
export function previewBaseFill(isLight: boolean): string {
  return readThemeColor(isLight ? '--cell-bg-light' : '--bg-secondary');
}

/**
 * Shaded constraint regions (even cells, sudoku-x diagonals, girandola) — the
 * same theme-invariant tint the board paints via --cell-shaded-bg.
 */
export function previewShadedFill(): string {
  return readThemeColor('--cell-shaded-bg');
}

/**
 * Asterisk and center-dot regions — matches the board's --cell-special-bg fill.
 * (Windoku now uses previewShadedFill, the same tint as the other shaded
 * variants.)
 */
export function previewRegionFill(): string {
  return readThemeColor('--cell-special-bg');
}

/**
 * Digit color for cells painted with previewShadedFill — the board switches
 * shaded cells to near-black ink (--cell-shaded-text) because the light tint
 * cannot hold contrast with the default light digit color.
 */
export function previewShadedText(): string {
  return readThemeColor('--cell-shaded-text');
}
