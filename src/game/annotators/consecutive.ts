import type { Mark } from '@/engine/constraints/consecutive';
import type { CellAnnotator } from '@/game/gameTypes';
import { neighborDescription } from './neighbor';

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

    const neighbors = related.map((mark) => (mark.a === cellId ? mark.b : mark.a));
    const descriptions = neighbors.map((id) => neighborDescription(cellId, id));

    return `consecutive with ${descriptions.join(', ')}`;
  },
};
