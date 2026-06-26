import type { CellId } from '@/engine/types';
import type { Rect } from '@/game/gameTypes';
import styles from './SujikenOverlay.module.css';

interface SujikenOverlayProps {
  rects: Map<CellId, Rect>;
}

export function SujikenOverlay({ rects }: SujikenOverlayProps) {
  const r0c0 = rects.get('r0c0');

  if (!r0c0) {
    return null;
  }

  const cs = r0c0.w;
  const n = 9;
  const total = n * cs;

  const points: [number, number][] = [[0, 0]];
  for (let i = 0; i < n; i += 1) {
    points.push([(i + 1) * cs, i * cs]);
    points.push([(i + 1) * cs, (i + 1) * cs]);
  }
  points.push([0, total]);

  const d = `M ${points.map(([x, y]) => `${x},${y}`).join(' L ')} Z`;

  return (
    <svg
      data-testid="sujiken-overlay"
      className={styles.overlay}
      viewBox={`0 0 ${total} ${total}`}
      width={total}
      height={total}
      overflow="visible"
      aria-hidden="true"
    >
      <path d={d} className={styles.border} data-testid="outer-border" />
      <line
        x1={0}
        y1={3 * cs}
        x2={3 * cs}
        y2={3 * cs}
        className={styles.regionLine}
        data-testid="region-line"
      />
      <line
        x1={0}
        y1={6 * cs}
        x2={6 * cs}
        y2={6 * cs}
        className={styles.regionLine}
        data-testid="region-line"
      />
      <line
        x1={3 * cs}
        y1={3 * cs}
        x2={3 * cs}
        y2={total}
        className={styles.regionLine}
        data-testid="region-line"
      />
      <line
        x1={6 * cs}
        y1={6 * cs}
        x2={6 * cs}
        y2={total}
        className={styles.regionLine}
        data-testid="region-line"
      />
    </svg>
  );
}
