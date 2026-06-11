import type { CellId } from '@/engine/types';
import type { Rect } from '@/game/gameTypes';

interface EvenOddOverlayProps {
  rects: Map<CellId, Rect>;
  structure: unknown;
}

// Even/odd cell colors are applied directly via data-even / data-odd on Cell elements.
// This overlay is kept to satisfy the overlay registry but renders nothing.
export function EvenOddOverlay(_props: EvenOddOverlayProps) {
  return null;
}
