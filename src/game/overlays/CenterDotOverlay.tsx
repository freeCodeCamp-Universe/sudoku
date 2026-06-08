import type { CellId } from '@/engine/types';
import type { Rect } from '@/game/gameTypes';
import { CENTER_DOT_CELLS } from '@/variants/centerDot';
import styles from './CenterDotOverlay.module.css';

interface CenterDotOverlayProps {
  rects: Map<CellId, Rect>;
  structure: unknown;
}

export function CenterDotOverlay({ rects }: CenterDotOverlayProps) {
  const firstRect = rects.get('r0c0');
  const lastRect = rects.get('r8c8');

  if (!firstRect || !lastRect) {
    return null;
  }

  const totalWidth = lastRect.x + lastRect.w;
  const totalHeight = lastRect.y + lastRect.h;

  return (
    <svg
      data-testid="center-dot-overlay"
      className={styles.overlay}
      viewBox={`0 0 ${totalWidth} ${totalHeight}`}
      width={totalWidth}
      height={totalHeight}
      aria-hidden="true"
    >
      {CENTER_DOT_CELLS.map(([row, col]) => {
        const rect = rects.get(`r${row}c${col}`);

        if (!rect) {
          return null;
        }

        return (
          <rect
            key={`r${row}c${col}`}
            data-testid="center-dot-cell"
            x={rect.x}
            y={rect.y}
            width={rect.w}
            height={rect.h}
            className={styles.centerDotCell}
          />
        );
      })}
    </svg>
  );
}
