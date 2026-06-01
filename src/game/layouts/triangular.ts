import { cellId } from '@/engine/grid';
import type { TriangularLayout } from '@/engine/types';
import type { LayoutStrategy, Rect } from '@/game/gameTypes';

const CELL_SIZE = 52;

function getLayout(variant: Parameters<LayoutStrategy['cellRects']>[0]): TriangularLayout {
  if (variant.layout.kind !== 'triangular') {
    throw new Error(`Unsupported layout kind: ${variant.layout.kind}`);
  }

  return variant.layout;
}

export const triangularLayout: LayoutStrategy = {
  cellRects(variant) {
    const { size } = getLayout(variant);
    const rects = new Map<string, Rect>();

    for (let row = 0; row < size; row += 1) {
      for (let col = 0; col <= row; col += 1) {
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
    const { size } = getLayout(variant);

    return { w: size * CELL_SIZE, h: size * CELL_SIZE };
  },
};
