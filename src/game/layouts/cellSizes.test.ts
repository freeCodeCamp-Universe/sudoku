import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  BOX_BOUNDARY_WIDTH,
  BOX_BOUNDARY_WIDTH_HIGH_CONTRAST,
  CAGE_RING,
  CAGE_RING_RATIO,
  CELL_SIZE_SPACIOUS,
  CELL_SIZE_STANDARD,
  GUTTER_SIZE,
} from './cellSizes';

// The responsive cell-size fit math assumes the frame widths declared in
// layers.css. This drift test keeps the TS constants and the CSS custom
// property in lockstep, mirroring the colorDocs drift-test pattern.
// (Read via fs: vitest's CSS handling returns an empty string for `?raw`,
// and jsdom's import.meta.url is not a file: URL, so resolve from the root.)
const layersCss = readFileSync(resolve(process.cwd(), 'src/app/layers.css'), 'utf8');
function boundaryWidthIn(css: string): number {
  const match = css.match(/--box-boundary-width:\s*(\d+)px/);
  if (!match) {
    throw new Error('no --box-boundary-width declaration found');
  }
  return Number(match[1]);
}

describe('cellSizes CSS drift', () => {
  const highContrastIndex = layersCss.indexOf('.high-contrast');

  it('should match the default --box-boundary-width in layers.css', () => {
    expect(boundaryWidthIn(layersCss.slice(0, highContrastIndex))).toBe(BOX_BOUNDARY_WIDTH);
  });

  it('should match the high-contrast --box-boundary-width in layers.css', () => {
    expect(boundaryWidthIn(layersCss.slice(highContrastIndex))).toBe(
      BOX_BOUNDARY_WIDTH_HIGH_CONTRAST
    );
  });

  it('should match the gutter cross size in Board.module.css', () => {
    const boardCss = readFileSync(
      resolve(process.cwd(), 'src/game/Board/Board.module.css'),
      'utf8'
    );
    const match = boardCss.match(/\.gutterCorner\s*\{[^}]*width:\s*(\d+)px/);
    if (!match) {
      throw new Error('no .gutterCorner width declaration found');
    }
    expect(Number(match[1])).toBe(GUTTER_SIZE);
  });

  it('should define the spacious cell size as the standard content box plus two cage rings', () => {
    expect(CELL_SIZE_SPACIOUS).toBe(CELL_SIZE_STANDARD + 2 * CAGE_RING);
  });

  it('should define the cage ring ratio from the spacious base size', () => {
    expect(CAGE_RING_RATIO).toBe(CAGE_RING / CELL_SIZE_SPACIOUS);
  });
});
