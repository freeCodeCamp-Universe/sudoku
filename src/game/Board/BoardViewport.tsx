import type { ReactNode } from 'react';
import type { BoardViewportState } from '@/game/gameTypes';
import styles from './BoardViewport.module.css';

export function BoardViewport({
  viewport,
  children,
}: {
  viewport: BoardViewportState;
  children: ReactNode;
}) {
  const { transform } = viewport;
  return (
    <div
      ref={viewport.viewportRef}
      className={styles.viewport}
      onPointerDown={viewport.onPointerDown}
      onPointerMove={viewport.onPointerMove}
      onPointerUp={viewport.onPointerUp}
      onPointerCancel={viewport.onPointerUp}
    >
      <div
        data-testid="board-viewport-content"
        className={styles.content}
        style={{
          transform: `translate(${transform.translateX}px, ${transform.translateY}px) scale(${transform.scale})`,
        }}
      >
        {children}
      </div>
    </div>
  );
}
