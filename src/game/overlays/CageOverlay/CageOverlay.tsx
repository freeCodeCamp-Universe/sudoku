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

const INSET = 2;

/**
 * Compute the start or end coordinate for one end of a cage boundary segment.
 * sign = -1 for the "near" end (start of line), +1 for the "far" end.
 *
 * - Outer corner  (perpendicular neighbor outside cage): truncate inward  → base - INSET * sign
 * - Inner corner  (diagonal neighbor inside cage):       extend outward   → base + INSET * sign
 * - Straight-through (perpendicular neighbor in cage):   no change        → base
 */
function extent(
  base: number,
  sign: 1 | -1,
  perpCage: number | undefined,
  cageIndex: number,
  diagCage: number | undefined
): number {
  if (perpCage !== cageIndex) return base - INSET * sign; // outer corner: truncate
  if (diagCage === cageIndex) return base + INSET * sign; // inner corner: extend
  return base; // straight-through
}

function cageBorderEdges(cages: Cage[], rects: Map<CellId, Rect>): Edge[] {
  const cellToCage = new Map<CellId, number>();
  cages.forEach((cage, index) => cage.cells.forEach((id) => cellToCage.set(id, index)));

  const edges: Edge[] = [];

  for (const [cellId, rect] of rects) {
    const ci = cellToCage.get(cellId);
    if (ci === undefined) continue;

    const { x, y, w, h } = rect;
    const cage = (id: CellId | null) => (id ? cellToCage.get(id) : undefined);

    const L = getNeighborId(cellId, 0, -1);
    const R = getNeighborId(cellId, 0, 1);
    const T = getNeighborId(cellId, -1, 0);
    const B = getNeighborId(cellId, 1, 0);
    const TL = getNeighborId(cellId, -1, -1);
    const TR = getNeighborId(cellId, -1, 1);
    const BL = getNeighborId(cellId, 1, -1);
    const BR = getNeighborId(cellId, 1, 1);

    // Right boundary
    if (cage(R) !== ci) {
      const y1 = extent(y, -1, cage(T), ci, cage(TR));
      const y2 = extent(y + h, 1, cage(B), ci, cage(BR));
      edges.push({ x1: x + w - INSET, y1, x2: x + w - INSET, y2 });
    }

    // Bottom boundary
    if (cage(B) !== ci) {
      const x1 = extent(x, -1, cage(L), ci, cage(BL));
      const x2 = extent(x + w, 1, cage(R), ci, cage(BR));
      edges.push({ x1, y1: y + h - INSET, x2, y2: y + h - INSET });
    }

    // Left boundary
    if (cage(L) !== ci) {
      const y1 = extent(y, -1, cage(T), ci, cage(TL));
      const y2 = extent(y + h, 1, cage(B), ci, cage(BL));
      edges.push({ x1: x + INSET, y1, x2: x + INSET, y2 });
    }

    // Top boundary
    if (cage(T) !== ci) {
      const x1 = extent(x, -1, cage(L), ci, cage(TL));
      const x2 = extent(x + w, 1, cage(R), ci, cage(TR));
      edges.push({ x1, y1: y + INSET, x2, y2: y + INSET });
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
            x={rect.x + INSET + 1}
            y={rect.y + INSET + 5}
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
