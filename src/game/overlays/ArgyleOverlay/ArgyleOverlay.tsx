import type { CellId } from '@/engine/types';
import type { Rect } from '@/game/gameTypes';
import { ARGYLE_D1_OFFSETS, ARGYLE_D2_SUMS } from '@/variants/argyle';
import styles from './ArgyleOverlay.module.css';

interface ArgyleOverlayProps {
  rects: Map<CellId, Rect>;
  structure: unknown;
}

const d1Set = new Set<string>(
  ARGYLE_D1_OFFSETS.flatMap((offset) =>
    Array.from({ length: 9 }, (_, r) => ({ r, c: r - offset }))
      .filter(({ c }) => c >= 0 && c < 9)
      .map(({ r, c }) => `r${r}c${c}`)
  )
);

const d2Set = new Set<string>(
  ARGYLE_D2_SUMS.flatMap((sum) =>
    Array.from({ length: 9 }, (_, r) => ({ r, c: sum - r }))
      .filter(({ c }) => c >= 0 && c < 9)
      .map(({ r, c }) => `r${r}c${c}`)
  )
);

export function ArgyleOverlay({ rects }: ArgyleOverlayProps) {
  const allRects = [...rects.values()];
  if (allRects.length === 0) return null;

  const maxX = Math.max(...allRects.map((r) => r.x + r.w));
  const maxY = Math.max(...allRects.map((r) => r.y + r.h));

  return (
    <svg
      aria-hidden="true"
      className={styles.overlay}
      width={maxX}
      height={maxY}
    >
      {[...rects.entries()].flatMap(([id, rect]) => {
        const lines = [];
        const { x, y, w, h } = rect;
        if (d1Set.has(id)) {
          lines.push(
            <line key={`d1-${id}`} x1={x} y1={y} x2={x + w} y2={y + h} className={styles.line} />
          );
        }
        if (d2Set.has(id)) {
          lines.push(
            <line key={`d2-${id}`} x1={x + w} y1={y} x2={x} y2={y + h} className={styles.line} />
          );
        }
        return lines;
      })}
    </svg>
  );
}
