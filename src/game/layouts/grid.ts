import { cellId, range } from '@/engine/grid';
import type { LayoutStrategy, Rect } from '@/game/gameTypes';

function getCellSize(gridSize: number): number {
  if (gridSize === 16) return 30;
  return 52;
}

export const gridLayout: LayoutStrategy = {
  cellRects(variant, cellSizeOverride) {
    if (variant.layout.kind !== 'grid') {
      throw new Error(`Unsupported layout kind: ${variant.layout.kind}`);
    }

    const rects = new Map<string, Rect>();
    const cellSize = cellSizeOverride ?? getCellSize(variant.layout.size);

    for (const row of range(variant.layout.size)) {
      for (const col of range(variant.layout.size)) {
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
    if (variant.layout.kind !== 'grid') {
      throw new Error(`Unsupported layout kind: ${variant.layout.kind}`);
    }

    const cellSize = cellSizeOverride ?? getCellSize(variant.layout.size);
    return { w: variant.layout.size * cellSize, h: variant.layout.size * cellSize };
  },
};
