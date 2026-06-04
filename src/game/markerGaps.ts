import type { CellId } from '@/engine/types';
import type { Relation } from '@/engine/constraints/greaterThan';
import type { MarkerEdge } from '@/game/gameTypes';

function parseCellId(id: CellId): { row: number; col: number } | null {
  const match = /^r(\d+)c(\d+)$/.exec(id);

  return match ? { row: Number(match[1]), col: Number(match[2]) } : null;
}

/**
 * Map each cell to the edges where an inter-cell marker (a greater-than
 * triangle) sits on the shared border. Cells use this to paint a
 * background-matched gap so the grid border appears to stop for the marker.
 *
 * Only adjacency decides the edge, not which side is greater: two cells in the
 * same row face each other across their inline edges, two in the same column
 * across their block edges.
 */
export function buildMarkerGaps(structure: unknown): Map<CellId, MarkerEdge[]> {
  const relations = (structure as { relations?: Relation[] } | undefined)?.relations ?? [];
  const gaps = new Map<CellId, MarkerEdge[]>();

  const addEdge = (id: CellId, edge: MarkerEdge) => {
    const edges = gaps.get(id);

    if (edges) {
      edges.push(edge);
    } else {
      gaps.set(id, [edge]);
    }
  };

  for (const { greater, lesser } of relations) {
    const greaterPos = parseCellId(greater);
    const lesserPos = parseCellId(lesser);

    if (!greaterPos || !lesserPos) {
      continue;
    }

    if (greaterPos.row === lesserPos.row) {
      const [startCell, endCell] =
        greaterPos.col < lesserPos.col ? [greater, lesser] : [lesser, greater];

      addEdge(startCell, 'inline-end');
      addEdge(endCell, 'inline-start');
    } else if (greaterPos.col === lesserPos.col) {
      const [topCell, bottomCell] =
        greaterPos.row < lesserPos.row ? [greater, lesser] : [lesser, greater];

      addEdge(topCell, 'block-end');
      addEdge(bottomCell, 'block-start');
    }
  }

  return gaps;
}
