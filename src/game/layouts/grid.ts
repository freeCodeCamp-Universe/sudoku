import { cellId, range } from '@/engine/grid';
import type { LayoutStrategy, Rect } from '@/game/gameTypes';
import { CELL_SIZE_COMPACT, CELL_SIZE_SPACIOUS, CELL_SIZE_STANDARD } from './cellSizes';

function baseCellSize(variant: Parameters<LayoutStrategy['baseCellSize']>[0]): number {
  if (variant.layout.kind !== 'grid') {
    throw new Error(`Unsupported layout kind: ${variant.layout.kind}`);
  }

  if (variant.layout.size === 16) {
    return CELL_SIZE_COMPACT;
  }

  if (variant.layout.cellSize === 'spacious') {
    return CELL_SIZE_SPACIOUS;
  }

  return CELL_SIZE_STANDARD;
}

export const gridLayout: LayoutStrategy = {
  baseCellSize,
  cellRects(variant, cellSizeOverride) {
    if (variant.layout.kind !== 'grid') {
      throw new Error(`Unsupported layout kind: ${variant.layout.kind}`);
    }

    const rects = new Map<string, Rect>();
    const cellSize = cellSizeOverride ?? baseCellSize(variant);

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

    const cellSize = cellSizeOverride ?? baseCellSize(variant);
    return { w: variant.layout.size * cellSize, h: variant.layout.size * cellSize };
  },
};
