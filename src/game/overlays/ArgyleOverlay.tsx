import type { CellId } from '@/engine/types';
import { range } from '@/engine/grid';
import type { Rect } from '@/game/gameTypes';
import styles from './ArgyleOverlay.module.css';

interface ArgyleOverlayProps {
  rects: Map<CellId, Rect>;
  structure: unknown;
}

// Display diagonals - every 3rd stripe in each direction, covering the full 9×9.
// These are wider than the constraint houses; they produce the argyle diamond pattern.
const D1_DISPLAY_OFFSETS = [-4, -1, 1, 4]; // col - row
const D2_DISPLAY_SUMS    = [4, 7, 9, 12];  // row + col

export function ArgyleOverlay({ rects }: ArgyleOverlayProps) {
  const firstRect = rects.get('r0c0');
  const lastRect = rects.get('r8c8');

  if (!firstRect || !lastRect) {
    return null;
  }

  const totalWidth = lastRect.x + lastRect.w;
  const totalHeight = lastRect.y + lastRect.h;
  const lines: React.ReactNode[] = [];

  for (const row of range(9)) {
    for (const col of range(9)) {
      const id = `r${row}c${col}`;
      const rect = rects.get(id);
      if (!rect) continue;

      const { x, y, w, h } = rect;
      const onD1 = D1_DISPLAY_OFFSETS.includes(col - row);
      const onD2 = D2_DISPLAY_SUMS.includes(row + col);

      if (onD1) {
        lines.push(
          <line key={`d1-${id}`} x1={x} y1={y} x2={x + w} y2={y + h} className={styles.line} />
        );
      }
      if (onD2) {
        lines.push(
          <line key={`d2-${id}`} x1={x + w} y1={y} x2={x} y2={y + h} className={styles.line} />
        );
      }
    }
  }

  return (
    <svg
      data-testid="argyle-overlay"
      className={styles.overlay}
      viewBox={`0 0 ${totalWidth} ${totalHeight}`}
      width={totalWidth}
      height={totalHeight}
      aria-hidden="true"
    >
      {lines}
    </svg>
  );
}
