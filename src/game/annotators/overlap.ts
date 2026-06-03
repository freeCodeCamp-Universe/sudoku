import type { CellAnnotator } from '@/game/gameTypes';

export const overlapAnnotator: CellAnnotator = {
  id: 'overlap',
  describe(cellId, ctx) {
    const grids = new Set<string>();

    for (const house of ctx.model.houses) {
      const match = /^g(\d+)-/.exec(house.id);

      if (match && house.cells.includes(cellId)) {
        grids.add(match[1]);
      }
    }

    return grids.size > 1 ? `shared by ${grids.size} grids` : null;
  },
};
