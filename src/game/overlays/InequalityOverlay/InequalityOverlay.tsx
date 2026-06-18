import type { CellId } from '@/engine/types';
import type { Relation } from '@/engine/constraints/greaterThan';
import type { Rect } from '@/game/gameTypes';
import styles from './InequalityOverlay.module.css';

interface InequalityOverlayProps {
  rects: Map<CellId, Rect>;
  structure: unknown;
}

function getRelations(structure: unknown): Relation[] {
  const relationStructure = structure as { relations?: Relation[] } | undefined;

  return relationStructure?.relations ?? [];
}

function triPoints(
  centerX: number,
  centerY: number,
  size: number,
  direction: 'up' | 'down' | 'left' | 'right'
): string {
  switch (direction) {
    case 'up':
      return `${centerX - size},${centerY + size} ${centerX},${centerY - size} ${centerX + size},${centerY + size}`;
    case 'down':
      return `${centerX - size},${centerY - size} ${centerX},${centerY + size} ${centerX + size},${centerY - size}`;
    case 'left':
      return `${centerX + size},${centerY - size} ${centerX - size},${centerY} ${centerX + size},${centerY + size}`;
    case 'right':
      return `${centerX - size},${centerY - size} ${centerX + size},${centerY} ${centerX - size},${centerY + size}`;
  }
}

export function InequalityOverlay({ rects, structure }: InequalityOverlayProps) {
  const relations = getRelations(structure);
  const allRects = [...rects.values()];

  if (relations.length === 0 || allRects.length === 0) {
    return null;
  }

  const maxX = Math.max(...allRects.map((rect) => rect.x + rect.w));
  const maxY = Math.max(...allRects.map((rect) => rect.y + rect.h));

  return (
    <svg
      aria-hidden="true"
      data-testid="inequality-overlay"
      className={styles.overlay}
      width={maxX}
      height={maxY}
    >
      {relations.map(({ greater, lesser }, index) => {
        const greaterRect = rects.get(greater);
        const lesserRect = rects.get(lesser);

        if (!greaterRect || !lesserRect) {
          return null;
        }

        const size = Math.max(3, Math.round((4 * greaterRect.w) / 52));

        if (greaterRect.y === lesserRect.y) {
          const leftRect = greaterRect.x < lesserRect.x ? greaterRect : lesserRect;
          const direction = lesserRect.x > greaterRect.x ? 'right' : 'left';

          return (
            <polygon
              key={`${greater}-${lesser}-${index}`}
              data-testid="inequality-marker"
              className={styles.triangle}
              points={triPoints(
                leftRect.x + leftRect.w,
                leftRect.y + leftRect.h / 2,
                size,
                direction
              )}
            />
          );
        }

        if (greaterRect.x !== lesserRect.x) {
          return null;
        }

        const topRect = greaterRect.y < lesserRect.y ? greaterRect : lesserRect;
        const direction = lesserRect.y > greaterRect.y ? 'down' : 'up';

        return (
          <polygon
            key={`${greater}-${lesser}-${index}`}
            data-testid="inequality-marker"
            className={styles.triangle}
            points={triPoints(topRect.x + topRect.w / 2, topRect.y + topRect.h, size, direction)}
          />
        );
      })}
    </svg>
  );
}
