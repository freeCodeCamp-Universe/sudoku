import type { CellId } from '@/engine/types';
import type { Arrow, Rect } from '@/game/gameTypes';
import styles from './ArrowOverlay.module.css';

interface ArrowOverlayProps {
  rects: Map<CellId, Rect>;
  structure: { arrows?: Arrow[] } | unknown;
}

function center(rect: Rect): { x: number; y: number } {
  return {
    x: rect.x + rect.w / 2,
    y: rect.y + rect.h / 2,
  };
}

export function ArrowOverlay({ rects, structure }: ArrowOverlayProps) {
  const arrows = (structure as { arrows?: Arrow[] } | undefined)?.arrows ?? [];
  const allRects = [...rects.values()];

  if (allRects.length === 0) {
    return null;
  }

  const maxX = Math.max(...allRects.map((rect) => rect.x + rect.w));
  const maxY = Math.max(...allRects.map((rect) => rect.y + rect.h));

  return (
    <svg
      aria-hidden="true"
      data-testid="arrow-overlay"
      className={styles.overlay}
      width={maxX}
      height={maxY}
    >
      <defs>
        <marker
          id="arrowhead"
          markerWidth="6"
          markerHeight="4"
          refX="6"
          refY="2"
          orient="auto"
        >
          <polygon points="0 0, 6 2, 0 4" className={styles.arrowhead} />
        </marker>
      </defs>
      {arrows.map((arrow, index) => {
        const bulbRect = rects.get(arrow.bulb);

        if (!bulbRect) {
          return null;
        }

        const bulbCenter = center(bulbRect);
        const pathCenters = arrow.path
          .map((id) => rects.get(id))
          .filter((rect): rect is Rect => rect !== undefined)
          .map(center);

        if (pathCenters.length === 0) {
          return null;
        }

        const points = [bulbCenter, ...pathCenters].map(({ x, y }) => `${x},${y}`).join(' ');

        return (
          <g key={`${arrow.bulb}-${index}`}>
            <circle
              cx={bulbCenter.x}
              cy={bulbCenter.y}
              r={bulbRect.w * 0.38}
              className={styles.bulbCircle}
              data-testid="arrow-circle"
            />
            <polyline
              points={points}
              className={styles.arrowLine}
              markerEnd="url(#arrowhead)"
              data-testid="arrow-path-line"
            />
          </g>
        );
      })}
    </svg>
  );
}
