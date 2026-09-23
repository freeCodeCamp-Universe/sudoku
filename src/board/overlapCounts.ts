import { cellId } from '@/engine/grid';
import type { CellId, MultiGridLayout } from '@/engine/types';

/**
 * How many subgrids a canvas cell belongs to, once it belongs to more than
 * one. Cells in a single subgrid (count 1) or in a gap (count 0) are not
 * overlaps and are absent from the map. No current multigrid layout stacks
 * more than five subgrids on one cell; anything denser shares the top rung.
 */
export type OverlapCount = 2 | 3 | 4 | 5;

const MAX_OVERLAP: OverlapCount = 5;

/**
 * Map each overlap cell to its subgrid-containment count, using the same
 * `CellId` scheme (`cellId(row, col)`) and containment test as
 * `multigridLayout.cellRects`.
 */
export function overlapCounts(layout: MultiGridLayout): Map<CellId, OverlapCount> {
  const { canvasRows, canvasCols, subGridSize, subGrids } = layout;
  const counts = new Map<CellId, OverlapCount>();

  for (let row = 0; row < canvasRows; row += 1) {
    for (let col = 0; col < canvasCols; col += 1) {
      const count = subGrids.reduce(
        (total, { originRow, originCol }) =>
          row >= originRow &&
          row < originRow + subGridSize &&
          col >= originCol &&
          col < originCol + subGridSize
            ? total + 1
            : total,
        0
      );

      if (count >= 2) {
        counts.set(cellId(row, col), Math.min(count, MAX_OVERLAP) as OverlapCount);
      }
    }
  }

  return counts;
}
