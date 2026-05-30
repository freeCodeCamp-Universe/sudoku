import type { CellId } from '@/engine/types';
import { range } from '@/engine/grid';
import type { Rect } from '@/game/gameTypes';
import { ARGYLE_D1_OFFSETS, ARGYLE_D2_SUMS } from '@/variants/argyle';
import styles from './ArgyleOverlay.module.css';

interface ArgyleOverlayProps {
  rects: Map<CellId, Rect>;
  structure: unknown;
}

function d1Cells(): [number, number][] {
  const cells: [number, number][] = [];

  for (const offset of ARGYLE_D1_OFFSETS) {
    for (const row of range(9)) {
      const col = row - offset;

      if (col >= 0 && col < 9) {
        cells.push([row, col]);
      }
    }
  }

  return cells;
}

function d2Cells(): [number, number][] {
  const cells: [number, number][] = [];

  for (const sum of ARGYLE_D2_SUMS) {
    for (const row of range(9)) {
      const col = sum - row;

      if (col >= 0 && col < 9) {
        cells.push([row, col]);
      }
    }
  }

  return cells;
}

export function ArgyleOverlay({ rects }: ArgyleOverlayProps) {
  const firstRect = rects.get('r0c0');
  const lastRect = rects.get('r8c8');

  if (!firstRect || !lastRect) {
    return null;
  }

  const totalWidth = lastRect.x + lastRect.w;
  const totalHeight = lastRect.y + lastRect.h;

  return (
    <svg
      data-testid="argyle-overlay"
      className={styles.overlay}
      viewBox={`0 0 ${totalWidth} ${totalHeight}`}
      width={totalWidth}
      height={totalHeight}
      aria-hidden="true"
    >
      <g>
        {d1Cells().map(([row, col]) => {
          const rect = rects.get(`r${row}c${col}`);

          if (!rect) {
            return null;
          }

          return (
            <rect
              key={`d1-r${row}c${col}`}
              data-testid="argyle-d1-cell"
              data-argyle-d1={`r${row}c${col}`}
              x={rect.x}
              y={rect.y}
              width={rect.w}
              height={rect.h}
              className={styles.d1Cell}
            />
          );
        })}
      </g>
      <g>
        {d2Cells().map(([row, col]) => {
          const rect = rects.get(`r${row}c${col}`);

          if (!rect) {
            return null;
          }

          return (
            <rect
              key={`d2-r${row}c${col}`}
              data-testid="argyle-d2-cell"
              data-argyle-d2={`r${row}c${col}`}
              x={rect.x}
              y={rect.y}
              width={rect.w}
              height={rect.h}
              className={styles.d2Cell}
            />
          );
        })}
      </g>
    </svg>
  );
}
