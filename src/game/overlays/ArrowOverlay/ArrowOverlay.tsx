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

function direction(from: { x: number; y: number }, to: { x: number; y: number }): { x: number; y: number } | null {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const length = Math.hypot(dx, dy);

  if (length === 0) {
    return null;
  }

  return { x: dx / length, y: dy / length };
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

        const firstPath = pathCenters[0];
        const startDir = direction(bulbCenter, firstPath);

        if (!startDir) {
          return null;
        }

        const shaftRadius = (18 / 52) * bulbRect.w;
        const startPoint = {
          x: bulbCenter.x + startDir.x * shaftRadius,
          y: bulbCenter.y + startDir.y * shaftRadius,
        };

        const lastPath = pathCenters[pathCenters.length - 1];
        const prevToLast = pathCenters[pathCenters.length - 2] ?? bulbCenter;
        const endDir = direction(prevToLast, lastPath);

        if (!endDir) {
          return null;
        }

        const endOffset = (10 / 52) * bulbRect.w;
        const endPoint = {
          x: lastPath.x - endDir.x * endOffset,
          y: lastPath.y - endDir.y * endOffset,
        };

        const shaftPoints = [startPoint, ...pathCenters.slice(0, -1), endPoint]
          .map(({ x, y }) => `${x},${y}`)
          .join(' ');

        const arrowheadSize = (6 / 52) * bulbRect.w;
        const perp = { x: -endDir.y, y: endDir.x };
        const baseA = {
          x: endPoint.x - endDir.x * arrowheadSize + perp.x * (arrowheadSize * 0.5),
          y: endPoint.y - endDir.y * arrowheadSize + perp.y * (arrowheadSize * 0.5),
        };
        const baseB = {
          x: endPoint.x - endDir.x * arrowheadSize - perp.x * (arrowheadSize * 0.5),
          y: endPoint.y - endDir.y * arrowheadSize - perp.y * (arrowheadSize * 0.5),
        };
        const arrowheadPoints = `${endPoint.x},${endPoint.y} ${baseA.x},${baseA.y} ${baseB.x},${baseB.y}`;

        return (
          <g key={`${arrow.bulb}-${index}`}>
            <circle
              cx={bulbCenter.x}
              cy={bulbCenter.y}
              r={shaftRadius}
              className={styles.bulbCircle}
              data-testid="arrow-circle"
            />
            <polyline
              points={shaftPoints}
              className={styles.arrowLine}
              data-testid="arrow-path-line"
            />
            <polygon points={arrowheadPoints} className={styles.arrowhead} data-testid="arrowhead" />
          </g>
        );
      })}
    </svg>
  );
}
