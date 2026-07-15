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
  const { active, transform } = viewport;
  return (
    <div
      data-testid="board-viewport"
      ref={viewport.viewportRef}
      className={active ? styles.viewport : styles.passthrough}
      onPointerDown={viewport.onPointerDown}
      onPointerMove={viewport.onPointerMove}
      onPointerUp={viewport.onPointerUp}
      onPointerCancel={viewport.onPointerUp}
    >
      <div
        data-testid="board-viewport-content"
        className={
          active
            ? viewport.animated
              ? `${styles.content} ${styles.contentAnimated}`
              : styles.content
            : styles.passthrough
        }
        style={
          active
            ? {
                transform: `translate(${transform.translateX}px, ${transform.translateY}px) scale(${transform.scale})`,
              }
            : undefined
        }
      >
        {children}
      </div>
    </div>
  );
}
