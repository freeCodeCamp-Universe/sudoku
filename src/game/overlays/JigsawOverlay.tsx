import type { CellId } from '@/engine/types';
import { range } from '@/engine/grid';
import type { Rect } from '@/game/gameTypes';
import { isJigsawStructure } from '@/variants/jigsaw';
import styles from './JigsawOverlay.module.css';

interface JigsawOverlayProps {
  rects: Map<CellId, Rect>;
  structure: unknown;
}

interface BorderLine {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

export function JigsawOverlay({ rects, structure }: JigsawOverlayProps) {
  if (!isJigsawStructure(structure)) {
    return null;
  }

  const firstRect = rects.get('r0c0');
  const lastRect = rects.get('r8c8');

  if (!firstRect || !lastRect) {
    return null;
  }

  const totalWidth = lastRect.x + lastRect.w;
  const totalHeight = lastRect.y + lastRect.h;
  const borders: BorderLine[] = [];

  for (const row of range(8)) {
    for (const col of range(9)) {
      if (structure.regions[row]?.[col] !== structure.regions[row + 1]?.[col]) {
        const rect = rects.get(`r${row}c${col}`);

        if (!rect) {
          continue;
        }

        borders.push({
          x1: rect.x,
          y1: rect.y + rect.h,
          x2: rect.x + rect.w,
          y2: rect.y + rect.h,
        });
      }
    }
  }

  for (const row of range(9)) {
    for (const col of range(8)) {
      if (structure.regions[row]?.[col] !== structure.regions[row]?.[col + 1]) {
        const rect = rects.get(`r${row}c${col}`);

        if (!rect) {
          continue;
        }

        borders.push({
          x1: rect.x + rect.w,
          y1: rect.y,
          x2: rect.x + rect.w,
          y2: rect.y + rect.h,
        });
      }
    }
  }

  return (
    <svg
      data-testid="jigsaw-overlay"
      className={styles.overlay}
      viewBox={`0 0 ${totalWidth} ${totalHeight}`}
      width={totalWidth}
      height={totalHeight}
      aria-hidden="true"
    >
      {borders.map((border, index) => (
        <line
          key={index}
          data-testid="region-border"
          data-region-border={index}
          x1={border.x1}
          y1={border.y1}
          x2={border.x2}
          y2={border.y2}
          className={styles.regionBorder}
        />
      ))}
    </svg>
  );
}
