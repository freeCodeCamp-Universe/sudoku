import { cellId } from '@/engine/grid';
import type { MultiGridLayout } from '@/engine/types';
import type { LayoutStrategy, Rect } from '@/game/gameTypes';
import { CELL_SIZE_COMPACT, CELL_SIZE_ROOMY, MULTIGRID_MAX_CANVAS_WIDTH } from './cellSizes';

function getLayout(variant: Parameters<LayoutStrategy['cellRects']>[0]): MultiGridLayout {
  if (variant.layout.kind !== 'multigrid') {
    throw new Error(`Unsupported layout kind: ${variant.layout.kind}`);
  }

  return variant.layout;
}

function baseCellSize(variant: Parameters<LayoutStrategy['baseCellSize']>[0]): number {
  const { canvasCols } = getLayout(variant);
  if (canvasCols === 21 || canvasCols === 15) {
    return CELL_SIZE_COMPACT;
  }

  if (canvasCols === 12) {
    return CELL_SIZE_ROOMY;
  }

  return Math.floor(MULTIGRID_MAX_CANVAS_WIDTH / canvasCols);
}

export const multigridLayout: LayoutStrategy = {
  baseCellSize,
  cellRects(variant, cellSizeOverride) {
    const { canvasRows, canvasCols, subGridSize, subGrids } = getLayout(variant);
    const cellSize = cellSizeOverride ?? baseCellSize(variant);
    const rects = new Map<string, Rect>();

    for (let row = 0; row < canvasRows; row += 1) {
      for (let col = 0; col < canvasCols; col += 1) {
        const isActive = subGrids.some(
          ({ originRow, originCol }) =>
            row >= originRow &&
            row < originRow + subGridSize &&
            col >= originCol &&
            col < originCol + subGridSize
        );

        if (!isActive) {
          continue;
        }

        rects.set(cellId(row, col), {
          x: col * cellSize,
          y: row * cellSize,
          w: cellSize,
          h: cellSize,
        });
      }
    }

    return rects;
  },
  canvasSize(variant, cellSizeOverride) {
    const { canvasRows, canvasCols } = getLayout(variant);
    const cellSize = cellSizeOverride ?? baseCellSize(variant);

    return { w: canvasCols * cellSize, h: canvasRows * cellSize };
  },
};
