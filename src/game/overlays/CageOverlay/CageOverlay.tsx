import type { CellId } from '@/engine/types';
import type { Cage, Rect } from '@/game/gameTypes';
import {
  CAGE_RING_INSET_RATIO,
  CAGE_RING_RATIO,
  CAGE_SUM_LABEL_CHAR_WIDTH,
  CAGE_SUM_LABEL_HEIGHT,
  CAGE_SUM_LABEL_PADDING,
  CAGE_SUM_LABEL_X_OFFSET,
} from '@/game/layouts/cellSizes';
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
  diagCage: number | undefined,
  inset: number
): number {
  if (perpCage !== cageIndex) return base - inset * sign; // outer corner: truncate
  if (diagCage === cageIndex) return base + inset * sign; // inner corner: extend
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
    const inset = w * CAGE_RING_RATIO * CAGE_RING_INSET_RATIO;
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
      const y1 = extent(y, -1, cage(T), ci, cage(TR), inset);
      const y2 = extent(y + h, 1, cage(B), ci, cage(BR), inset);
      edges.push({ x1: x + w - inset, y1, x2: x + w - inset, y2 });
    }

    // Bottom boundary
    if (cage(B) !== ci) {
      const x1 = extent(x, -1, cage(L), ci, cage(BL), inset);
      const x2 = extent(x + w, 1, cage(R), ci, cage(BR), inset);
      edges.push({ x1, y1: y + h - inset, x2, y2: y + h - inset });
    }

    // Left boundary
    if (cage(L) !== ci) {
      const y1 = extent(y, -1, cage(T), ci, cage(TL), inset);
      const y2 = extent(y + h, 1, cage(B), ci, cage(BL), inset);
      edges.push({ x1: x + inset, y1, x2: x + inset, y2 });
    }

    // Top boundary
    if (cage(T) !== ci) {
      const x1 = extent(x, -1, cage(L), ci, cage(TL), inset);
      const x2 = extent(x + w, 1, cage(R), ci, cage(TR), inset);
      edges.push({ x1, y1: y + inset, x2, y2: y + inset });
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
          data-testid="cage-line"
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

        const inset = rect.w * CAGE_RING_RATIO * CAGE_RING_INSET_RATIO;
        const label = String(cage.sum);
        const labelX = rect.x + inset + CAGE_SUM_LABEL_X_OFFSET;
        const labelY = rect.y + inset;
        const knockoutWidth = label.length * CAGE_SUM_LABEL_CHAR_WIDTH + CAGE_SUM_LABEL_PADDING;

        return (
          <g key={`${cage.sum}-${index}`}>
            <rect
              data-testid="cage-sum-knockout"
              x={labelX - CAGE_SUM_LABEL_PADDING / 2}
              y={labelY - CAGE_SUM_LABEL_HEIGHT / 2}
              width={knockoutWidth}
              height={CAGE_SUM_LABEL_HEIGHT}
              className={styles.sumKnockout}
            />
            <text x={labelX} y={labelY} className={styles.sumLabel} data-testid="cage-sum-label">
              {label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
