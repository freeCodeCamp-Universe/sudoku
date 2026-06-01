import type { Mark } from '@/engine/constraints/consecutive';
import type { CellAnnotator } from '@/game/gameTypes';

function getMarks(ctx: Parameters<CellAnnotator['describe']>[1]): Mark[] {
  const structure = ctx.model.structure as { marks?: Mark[] } | undefined;

  return structure?.marks ?? [];
}

export const consecutiveAnnotator: CellAnnotator = {
  id: 'consecutive-cell',
  describe(cellId, ctx) {
    const related = getMarks(ctx).filter((mark) => mark.a === cellId || mark.b === cellId);

    if (related.length === 0) {
      return null;
    }

    return `${related.length} consecutive neighbor${related.length === 1 ? '' : 's'}`;
  },
};
