import type { CellId } from '@/engine/types';
import type { Mark } from '@/engine/constraints/consecutive';
import type { Rect } from '@/game/gameTypes';
import styles from './ConsecutiveOverlay.module.css';

interface ConsecutiveOverlayProps {
  rects: Map<CellId, Rect>;
  structure: unknown;
}

function getMarks(structure: unknown): Mark[] {
  const markStructure = structure as { marks?: Mark[] } | undefined;

  return markStructure?.marks ?? [];
}

export function ConsecutiveOverlay({ rects, structure }: ConsecutiveOverlayProps) {
  const marks = getMarks(structure);
  const allRects = [...rects.values()];

  if (marks.length === 0 || allRects.length === 0) {
    return null;
  }

  const maxX = Math.max(...allRects.map((rect) => rect.x + rect.w));
  const maxY = Math.max(...allRects.map((rect) => rect.y + rect.h));
  const radius = Math.max(3, Math.round((5 * allRects[0].w) / 52));

  return (
    <svg
      aria-hidden="true"
      data-testid="consecutive-overlay"
      className={styles.overlay}
      width={maxX}
      height={maxY}
    >
      {marks.map(({ a, b }, index) => {
        const aRect = rects.get(a);
        const bRect = rects.get(b);

        if (!aRect || !bRect) {
          return null;
        }

        if (aRect.y === bRect.y) {
          const leftRect = aRect.x < bRect.x ? aRect : bRect;

          return (
            <circle
              key={`${a}-${b}-${index}`}
              data-testid="consecutive-dot"
              className={styles.dot}
              cx={leftRect.x + leftRect.w}
              cy={leftRect.y + leftRect.h / 2}
              r={radius}
            />
          );
        }

        if (aRect.x !== bRect.x) {
          return null;
        }

        const topRect = aRect.y < bRect.y ? aRect : bRect;

        return (
          <circle
            key={`${a}-${b}-${index}`}
            data-testid="consecutive-dot"
            className={styles.dot}
            cx={topRect.x + topRect.w / 2}
            cy={topRect.y + topRect.h}
            r={radius}
          />
        );
      })}
    </svg>
  );
}
