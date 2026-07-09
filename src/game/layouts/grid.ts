import { cellId, range } from '@/engine/grid';
import type { LayoutStrategy, Rect } from '@/game/gameTypes';

export const gridLayout: LayoutStrategy = {
  baseCellSize(variant) {
    if (variant.layout.kind !== 'grid') {
      throw new Error(`Unsupported layout kind: ${variant.layout.kind}`);
    }

    return variant.layout.size === 16 ? 30 : 52;
  },
  cellRects(variant, cellSizeOverride) {
    if (variant.layout.kind !== 'grid') {
      throw new Error(`Unsupported layout kind: ${variant.layout.kind}`);
    }

    const rects = new Map<string, Rect>();
    const cellSize = cellSizeOverride ?? this.baseCellSize(variant);

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

    const cellSize = cellSizeOverride ?? this.baseCellSize(variant);
    return { w: variant.layout.size * cellSize, h: variant.layout.size * cellSize };
  },
};
