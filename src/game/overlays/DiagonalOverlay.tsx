import type { CellId } from '@/engine/types';
import type { Rect } from '@/game/gameTypes';
import { ANTI_DIAGONAL_CELLS, MAIN_DIAGONAL_CELLS } from '@/variants/sudoku-x';
import styles from './DiagonalOverlay.module.css';

interface DiagonalOverlayProps {
  rects: Map<CellId, Rect>;
  structure: unknown;
}

function center(rect: Rect) {
  return { x: rect.x + rect.w / 2, y: rect.y + rect.h / 2 };
}

export function DiagonalOverlay({ rects }: DiagonalOverlayProps) {
  const mainDiagonal = MAIN_DIAGONAL_CELLS.map((id) => rects.get(id));
  const antiDiagonal = ANTI_DIAGONAL_CELLS.map((id) => rects.get(id));

  if (!mainDiagonal.every(Boolean) || !antiDiagonal.every(Boolean)) {
    return null;
  }

  const firstMain = mainDiagonal[0]!;
  const lastMain = mainDiagonal[mainDiagonal.length - 1]!;
  const firstAnti = antiDiagonal[0]!;
  const lastAnti = antiDiagonal[antiDiagonal.length - 1]!;
  const totalWidth = lastMain.x + lastMain.w;
  const totalHeight = lastMain.y + lastMain.h;
  const mainStart = center(firstMain);
  const mainEnd = center(lastMain);
  const antiStart = center(firstAnti);
  const antiEnd = center(lastAnti);

  return (
    <svg
      data-testid="diagonal-overlay"
      className={styles.overlay}
      viewBox={`0 0 ${totalWidth} ${totalHeight}`}
      width={totalWidth}
      height={totalHeight}
      aria-hidden="true"
    >
      <line
        data-testid="diagonal-line"
        data-diagonal="main"
        x1={mainStart.x}
        y1={mainStart.y}
        x2={mainEnd.x}
        y2={mainEnd.y}
        className={styles.diagonalLine}
      />
      <line
        data-testid="diagonal-line"
        data-diagonal="anti"
        x1={antiStart.x}
        y1={antiStart.y}
        x2={antiEnd.x}
        y2={antiEnd.y}
        className={styles.diagonalLine}
      />
    </svg>
  );
}
