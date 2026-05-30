import type { CellId } from '@/engine/types';
import type { Cage, Rect } from '@/game/gameTypes';
import styles from './CageOverlay.module.css';

interface CageOverlayProps {
  rects: Map<CellId, Rect>;
  structure: { cages?: Cage[] } | unknown;
}

type Edge = { x1: number; y1: number; x2: number; y2: number };

function parseCellId(id: CellId): { row: number; col: number } | null {
  const match = /^r(\d+)c(\d+)$/.exec(id);

  if (!match) {
    return null;
  }

  return { row: Number(match[1]), col: Number(match[2]) };
}

function getNeighborId(id: CellId, deltaRow: number, deltaCol: number): CellId | null {
  const coords = parseCellId(id);
  if (!coords) {
    return null;
  }

  return `r${coords.row + deltaRow}c${coords.col + deltaCol}`;
}

function cageBorderEdges(cages: Cage[], rects: Map<CellId, Rect>): Edge[] {
  const cellToCage = new Map<CellId, number>();

  cages.forEach((cage, index) => {
    cage.cells.forEach((cellId) => {
      cellToCage.set(cellId, index);
    });
  });

  const edges: Edge[] = [];

  for (const [cellId, rect] of rects) {
    const cageIndex = cellToCage.get(cellId);
    if (cageIndex === undefined) {
      continue;
    }

    const rightId = getNeighborId(cellId, 0, 1);
    const rightCageIndex = rightId ? cellToCage.get(rightId) : undefined;
    if (rightCageIndex !== cageIndex) {
      edges.push({
        x1: rect.x + rect.w,
        y1: rect.y,
        x2: rect.x + rect.w,
        y2: rect.y + rect.h,
      });
    }

    const bottomId = getNeighborId(cellId, 1, 0);
    const bottomCageIndex = bottomId ? cellToCage.get(bottomId) : undefined;
    if (bottomCageIndex !== cageIndex) {
      edges.push({
        x1: rect.x,
        y1: rect.y + rect.h,
        x2: rect.x + rect.w,
        y2: rect.y + rect.h,
      });
    }

    const leftId = getNeighborId(cellId, 0, -1);
    const leftCageIndex = leftId ? cellToCage.get(leftId) : undefined;
    if (leftCageIndex !== cageIndex) {
      edges.push({
        x1: rect.x,
        y1: rect.y,
        x2: rect.x,
        y2: rect.y + rect.h,
      });
    }

    const topId = getNeighborId(cellId, -1, 0);
    const topCageIndex = topId ? cellToCage.get(topId) : undefined;
    if (topCageIndex !== cageIndex) {
      edges.push({
        x1: rect.x,
        y1: rect.y,
        x2: rect.x + rect.w,
        y2: rect.y,
      });
    }
  }

  return edges;
}

function topLeftRect(cage: Cage, rects: Map<CellId, Rect>): Rect | undefined {
  const topLeftCell = [...cage.cells].sort((left, right) => {
    const leftCoords = parseCellId(left);
    const rightCoords = parseCellId(right);

    if (!leftCoords || !rightCoords) {
      return 0;
    }

    return leftCoords.row !== rightCoords.row
      ? leftCoords.row - rightCoords.row
      : leftCoords.col - rightCoords.col;
  })[0];

  return topLeftCell ? rects.get(topLeftCell) : undefined;
}

export function CageOverlay({ rects, structure }: CageOverlayProps) {
  const cages = (structure as { cages?: Cage[] } | undefined)?.cages ?? [];
  const allRects = [...rects.values()];

  if (allRects.length === 0) {
    return null;
  }

  const maxX = Math.max(...allRects.map((rect) => rect.x + rect.w));
  const maxY = Math.max(...allRects.map((rect) => rect.y + rect.h));
  const edges = cageBorderEdges(cages, rects);

  return (
    <svg
      aria-hidden="true"
      data-testid="cage-overlay"
      className={styles.overlay}
      width={maxX}
      height={maxY}
      style={{ position: 'absolute', insetInlineStart: 0, insetBlockStart: 0 }}
    >
      {edges.map((edge, index) => (
        <line
          key={`${edge.x1}-${edge.y1}-${edge.x2}-${edge.y2}-${index}`}
          x1={edge.x1}
          y1={edge.y1}
          x2={edge.x2}
          y2={edge.y2}
          className={styles.cageLine}
        />
      ))}
      {cages.map((cage, index) => {
        const rect = topLeftRect(cage, rects);

        if (!rect) {
          return null;
        }

        return (
          <text
            key={`${cage.sum}-${index}`}
            x={rect.x + 3}
            y={rect.y + 11}
            className={styles.sumLabel}
            data-testid="cage-sum-label"
          >
            {cage.sum}
          </text>
        );
      })}
    </svg>
  );
}
