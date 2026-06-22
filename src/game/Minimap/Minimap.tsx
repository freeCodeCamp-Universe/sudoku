import type { PointerEvent as ReactPointerEvent } from 'react';
import type { CellId } from '@/engine/types';
import type { Rect, Size } from '@/game/gameTypes';
import { indicatorRect } from '@/game/boardViewport';
import styles from './Minimap.module.css';

const MINIMAP_WIDTH = 150;

interface MinimapProps {
  rects: Map<CellId, Rect>;
  filled: Set<CellId>;
  board: Size;
  viewport: Size;
  transform: { scale: number; translateX: number; translateY: number };
  onSeek(point: { x: number; y: number }): void;
}

export function Minimap({ rects, filled, board, viewport, transform, onSeek }: MinimapProps) {
  const scale = MINIMAP_WIDTH / board.w;
  const height = board.h * scale;
  const minimap: Size = { w: MINIMAP_WIDTH, h: height };
  const indicator = indicatorRect(transform, board, viewport, minimap);

  function seek(e: ReactPointerEvent<SVGSVGElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    onSeek({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  }

  return (
    <svg
      role="img"
      aria-label="Board overview. Tap to move the visible area."
      viewBox={`0 0 ${MINIMAP_WIDTH} ${height}`}
      className={styles.minimap}
      onPointerDown={seek}
      onPointerMove={(e) => {
        if (e.buttons === 1) seek(e);
      }}
    >
      {[...rects.entries()].map(([id, r]) => (
        <rect
          key={id}
          className={filled.has(id) ? styles.filled : styles.cell}
          x={r.x * scale}
          y={r.y * scale}
          width={r.w * scale}
          height={r.h * scale}
        />
      ))}
      <rect
        className={styles.indicator}
        x={indicator.x}
        y={indicator.y}
        width={indicator.w}
        height={indicator.h}
      />
    </svg>
  );
}
