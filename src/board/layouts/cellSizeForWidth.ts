import type { Variant } from '@/engine/types';
import { boardFrameEdge, framedBoardSize, gutteredBoardSize } from '@/board/boardFrame';
import { CELL_SIZE_STEPS } from './cellSizes';
import { resolveLayout } from './registry';

export function cellSizeForWidth(
  availableWidth: number,
  variant: Variant,
  highContrast: boolean
): number {
  const layout = resolveLayout(variant.layout.kind);
  const base = layout.baseCellSize(variant);
  const frameEdge = boardFrameEdge(variant.layout.kind, highContrast);
  const gutters = variant.deriveGutters || layout.gutters ? {} : undefined;
  const fitted = CELL_SIZE_STEPS.find((step) => {
    if (step > base) {
      return false;
    }
    const framed = framedBoardSize(layout.canvasSize(variant, step), frameEdge);
    return gutteredBoardSize(framed, gutters).w <= availableWidth;
  });

  return fitted ?? Math.min(CELL_SIZE_STEPS[CELL_SIZE_STEPS.length - 1], base);
}
