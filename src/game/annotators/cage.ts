import type { Cage, CellAnnotator } from '@/game/gameTypes';

function getCages(ctx: Parameters<CellAnnotator['describe']>[1]): Cage[] | undefined {
  return (ctx.model.structure as { cages?: Cage[] } | undefined)?.cages;
}

export const cageSumAnnotator: CellAnnotator = {
  id: 'cage-sum',
  describe(cellId, ctx) {
    const cages = getCages(ctx);
    if (!cages) {
      return null;
    }

    const cage = cages.find((entry) => entry.cells.includes(cellId));
    if (!cage) {
      return null;
    }

    return `cage sum ${cage.sum}, ${cage.cells.length} cells`;
  },
};
