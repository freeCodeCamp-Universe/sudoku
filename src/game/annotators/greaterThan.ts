import type { Relation } from '@/engine/constraints/greaterThan';
import type { CellAnnotator } from '@/game/gameTypes';

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

    if (greaterSides.length > 0) {
      parts.push(
        `greater than ${greaterSides.length} neighbor${greaterSides.length === 1 ? '' : 's'}`
      );
    }

    if (lesserSides.length > 0) {
      parts.push(`less than ${lesserSides.length} neighbor${lesserSides.length === 1 ? '' : 's'}`);
    }

    return parts.join(', ');
  },
};
