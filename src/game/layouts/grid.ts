import { cellId, range } from '@/engine/grid';
import type { LayoutStrategy, Rect, Size } from '@/game/gameTypes';

const CELL_SIZE = 52;

function getGridSize(size: number): Size {
  const total = size * CELL_SIZE;

  return { w: total, h: total };
}

export const gridLayout: LayoutStrategy = {
  cellRects(variant) {
    if (variant.layout.kind !== 'grid') {
      throw new Error(`Unsupported layout kind: ${variant.layout.kind}`);
    }

    const rects = new Map<string, Rect>();

    for (const row of range(variant.layout.size)) {
      for (const col of range(variant.layout.size)) {
        rects.set(cellId(row, col), {
          x: col * CELL_SIZE,
          y: row * CELL_SIZE,
          w: CELL_SIZE,
          h: CELL_SIZE,
        });
      }
    }

    return rects;
  },
  canvasSize(variant) {
    if (variant.layout.kind !== 'grid') {
      throw new Error(`Unsupported layout kind: ${variant.layout.kind}`);
    }

    return getGridSize(variant.layout.size);
  },
};
