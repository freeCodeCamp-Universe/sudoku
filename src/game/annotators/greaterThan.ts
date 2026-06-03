import type { Relation } from '@/engine/constraints/greaterThan';
import type { CellAnnotator } from '@/game/gameTypes';
import { neighborDescription } from './neighbor';

function getRelations(ctx: Parameters<CellAnnotator['describe']>[1]): Relation[] {
  const structure = ctx.model.structure as { relations?: Relation[] } | undefined;

  return structure?.relations ?? [];
}

export const greaterThanAnnotator: CellAnnotator = {
  id: 'greater-than-cell',
  describe(cellId, ctx) {
    const relations = getRelations(ctx);
    const greaterSides = relations.filter((relation) => relation.greater === cellId);
    const lesserSides = relations.filter((relation) => relation.lesser === cellId);

    if (greaterSides.length === 0 && lesserSides.length === 0) {
      return null;
    }

    const parts: string[] = [];

    for (const relation of greaterSides) {
      parts.push(`greater than ${neighborDescription(cellId, relation.lesser)}`);
    }

    for (const relation of lesserSides) {
      parts.push(`less than ${neighborDescription(cellId, relation.greater)}`);
    }

    return parts.join(', ');
  },
};
