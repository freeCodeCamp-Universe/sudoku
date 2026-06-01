import type { CellId } from '@/engine/types';
import type { Rect } from '@/game/gameTypes';
import { WINDOKU_WINDOWS } from '@/variants/windoku';
import styles from './WindokuOverlay.module.css';

interface WindokuOverlayProps {
  rects: Map<CellId, Rect>;
  structure: unknown;
}

function windowBounds(cells: [number, number][], rects: Map<CellId, Rect>): Rect | null {
  const windowRects = cells
    .map(([row, col]) => rects.get(`r${row}c${col}`))
    .filter((rect): rect is Rect => rect !== undefined);

  if (windowRects.length === 0) {
    return null;
  }

  const x = Math.min(...windowRects.map((rect) => rect.x));
  const y = Math.min(...windowRects.map((rect) => rect.y));
  const x2 = Math.max(...windowRects.map((rect) => rect.x + rect.w));
  const y2 = Math.max(...windowRects.map((rect) => rect.y + rect.h));

  return { x, y, w: x2 - x, h: y2 - y };
}

export function WindokuOverlay({ rects }: WindokuOverlayProps) {
  const firstRect = rects.get('r0c0');
  const lastRect = rects.get('r8c8');

  if (!firstRect || !lastRect) {
    return null;
  }

  const totalWidth = lastRect.x + lastRect.w;
  const totalHeight = lastRect.y + lastRect.h;

  return (
    <svg
      data-testid="windoku-overlay"
      className={styles.overlay}
      viewBox={`0 0 ${totalWidth} ${totalHeight}`}
      width={totalWidth}
      height={totalHeight}
      aria-hidden="true"
    >
      {WINDOKU_WINDOWS.map((window, index) => {
        const bounds = windowBounds(window, rects);

        if (!bounds) {
          return null;
        }

        return (
          <rect
            key={index}
            data-testid="windoku-window"
            data-window={index}
            x={bounds.x}
            y={bounds.y}
            width={bounds.w}
            height={bounds.h}
            className={styles.window}
          />
        );
      })}
    </svg>
  );
}
