import type { CellId } from '@/engine/types';
import type { Rect } from '@/game/gameTypes';
import styles from './EvenOddOverlay.module.css';

interface EvenOddOverlayProps {
  rects: Map<CellId, Rect>;
  structure: { parityMap: Map<CellId, 0 | 1> } | unknown;
}

export function EvenOddOverlay({ rects, structure }: EvenOddOverlayProps) {
  const parityMap = (structure as { parityMap?: Map<CellId, 0 | 1> } | undefined)?.parityMap;

  if (!parityMap || parityMap.size === 0) {
    return null;
  }

  return (
    <>
      {Array.from(parityMap.entries()).map(([cellId, parity]) => {
        const rect = rects.get(cellId);

        if (!rect) {
          return null;
        }

        return (
          <div
            key={cellId}
            data-parity={parity === 0 ? 'even' : 'odd'}
            data-testid={parity === 0 ? 'parity-even' : 'parity-odd'}
            className={parity === 0 ? styles.even : styles.odd}
            style={{
              insetInlineStart: rect.x,
              insetBlockStart: rect.y,
              width: rect.w,
              height: rect.h,
            }}
          />
        );
      })}
    </>
  );
}
