import type { CellId } from '@/engine/types';
import type { Rect } from '@/game/gameTypes';
import { ASTERISK_CELLS } from '@/variants/asterisk';
import styles from './AsteriskOverlay.module.css';

interface AsteriskOverlayProps {
  rects: Map<CellId, Rect>;
  structure: unknown;
}

export function AsteriskOverlay({ rects }: AsteriskOverlayProps) {
  const firstRect = rects.get('r0c0');
  const lastRect = rects.get('r8c8');

  if (!firstRect || !lastRect) {
    return null;
  }

  const totalWidth = lastRect.x + lastRect.w;
  const totalHeight = lastRect.y + lastRect.h;

  return (
    <svg
      data-testid="asterisk-overlay"
      className={styles.overlay}
      viewBox={`0 0 ${totalWidth} ${totalHeight}`}
      width={totalWidth}
      height={totalHeight}
      aria-hidden="true"
    >
      {ASTERISK_CELLS.map(([row, col]) => {
        const rect = rects.get(`r${row}c${col}`);

        if (!rect) {
          return null;
        }

        return (
          <rect
            key={`r${row}c${col}`}
            data-testid="asterisk-cell"
            data-asterisk-cell={`r${row}c${col}`}
            x={rect.x}
            y={rect.y}
            width={rect.w}
            height={rect.h}
            className={styles.asteriskCell}
          />
        );
      })}
    </svg>
  );
}
