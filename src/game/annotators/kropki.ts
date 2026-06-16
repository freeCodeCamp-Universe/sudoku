import type { KropkiMark } from '@/engine/constraints/kropki';
import type { CellAnnotator } from '@/game/gameTypes';
import { neighborDescription } from './neighbor';

function getMarks(ctx: Parameters<CellAnnotator['describe']>[1]): KropkiMark[] {
  const structure = ctx.model.structure as { kropkiMarks?: KropkiMark[] } | undefined;

  return structure?.kropkiMarks ?? [];
}

export const kropkiAnnotator: CellAnnotator = {
  id: 'kropki-cell',
  describe(cellId, ctx) {
    const related = getMarks(ctx).filter((m) => m.a === cellId || m.b === cellId);

    if (related.length === 0) return null;

    const parts = related.map((m) => {
      const neighbor = m.a === cellId ? m.b : m.a;
      const dir = neighborDescription(cellId, neighbor);
      return m.kind === 'black'
        ? `black dot (ratio 1:2) with ${dir}`
        : `white dot (consecutive) with ${dir}`;
    });

    return parts.join(', ');
  },
};
