import { cellId } from '@/engine/grid';
import type { TriangularLayout } from '@/engine/types';
import type { LayoutStrategy, Rect } from '@/game/gameTypes';
import { CELL_SIZE_STANDARD } from './cellSizes';

function getLayout(variant: Parameters<LayoutStrategy['cellRects']>[0]): TriangularLayout {
  if (variant.layout.kind !== 'triangular') {
    throw new Error(`Unsupported layout kind: ${variant.layout.kind}`);
  }

  return variant.layout;
}

export const triangularLayout: LayoutStrategy = {
  baseCellSize() {
    return CELL_SIZE_STANDARD;
  },
  cellRects(variant, cellSizeOverride) {
    const { size } = getLayout(variant);
    const cellSize = cellSizeOverride ?? this.baseCellSize(variant);
    const rects = new Map<string, Rect>();

    for (let row = 0; row < size; row += 1) {
      for (let col = 0; col <= row; col += 1) {
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
    const { size } = getLayout(variant);
    const cellSize = cellSizeOverride ?? this.baseCellSize(variant);

    return { w: size * cellSize, h: size * cellSize };
  },
};
