import type { KropkiMark } from '@/engine/constraints/kropki';
import type { CellId } from '@/engine/types';
import type { Rect } from '@/game/gameTypes';
import styles from './KropkiOverlay.module.css';

interface KropkiOverlayProps {
  rects: Map<CellId, Rect>;
  structure: unknown;
}

function getMarks(structure: unknown): KropkiMark[] {
  const s = structure as { kropkiMarks?: KropkiMark[] } | undefined;

  return s?.kropkiMarks ?? [];
}

export function KropkiOverlay({ rects, structure }: KropkiOverlayProps) {
  const marks = getMarks(structure);
  const allRects = [...rects.values()];

  if (marks.length === 0 || allRects.length === 0) {
    return null;
  }

  const maxX = Math.max(...allRects.map((r) => r.x + r.w));
  const maxY = Math.max(...allRects.map((r) => r.y + r.h));
  const radius = Math.max(3, Math.round((5 * allRects[0].w) / 52));

  return (
    <svg
      aria-hidden="true"
      data-testid="kropki-overlay"
      className={styles.overlay}
      width={maxX}
      height={maxY}
    >
      {marks.map(({ a, b, kind }, index) => {
        const aRect = rects.get(a);
        const bRect = rects.get(b);

        if (!aRect || !bRect) return null;

        let cx: number;
        let cy: number;

        if (aRect.y === bRect.y) {
          const leftRect = aRect.x < bRect.x ? aRect : bRect;
          cx = leftRect.x + leftRect.w;
          cy = leftRect.y + leftRect.h / 2;
        } else if (aRect.x === bRect.x) {
          const topRect = aRect.y < bRect.y ? aRect : bRect;
          cx = topRect.x + topRect.w / 2;
          cy = topRect.y + topRect.h;
        } else {
          return null;
        }

        return (
          <circle
            key={`${a}-${b}-${index}`}
            data-testid={kind === 'black' ? 'kropki-black-dot' : 'kropki-white-dot'}
            className={kind === 'black' ? styles.dotBlack : styles.dotWhite}
            cx={cx}
            cy={cy}
            r={radius}
          />
        );
      })}
    </svg>
  );
}
