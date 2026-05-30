import { cellId } from '@/engine/grid';
import type { MultiGridLayout } from '@/engine/types';
import type { LayoutStrategy, Rect } from '@/game/gameTypes';

function getCellSize(canvasCols: number): number {
  if (canvasCols === 21) {
    return 30;
  }

  if (canvasCols === 12) {
    return 40;
  }

  return Math.floor(400 / canvasCols);
}

function getLayout(variant: Parameters<LayoutStrategy['cellRects']>[0]): MultiGridLayout {
  if (variant.layout.kind !== 'multigrid') {
    throw new Error(`Unsupported layout kind: ${variant.layout.kind}`);
  }

  return variant.layout;
}

export const multigridLayout: LayoutStrategy = {
  cellRects(variant) {
    const { canvasRows, canvasCols, subGridSize, subGrids } = getLayout(variant);
    const cellSize = getCellSize(canvasCols);
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
  canvasSize(variant) {
    const { canvasRows, canvasCols } = getLayout(variant);
    const cellSize = getCellSize(canvasCols);

    return { w: canvasCols * cellSize, h: canvasRows * cellSize };
  },
};
