import type { Arrow, CellAnnotator } from '@/game/gameTypes';

function getArrows(ctx: Parameters<CellAnnotator['describe']>[1]): Arrow[] | undefined {
  return (ctx.model.structure as { arrows?: Arrow[] } | undefined)?.arrows;
}

export const arrowBulbAnnotator: CellAnnotator = {
  id: 'arrow-bulb',
  describe(cellId, ctx) {
    const arrows = getArrows(ctx);
    if (!arrows) {
      return null;
    }

    return arrows.some((arrow) => arrow.bulb === cellId) ? 'arrow circle' : null;
  },
};

export const arrowPathAnnotator: CellAnnotator = {
  id: 'arrow-path',
  describe(cellId, ctx) {
    const arrows = getArrows(ctx);
    if (!arrows) {
      return null;
    }

    return arrows.some((arrow) => arrow.path.includes(cellId)) ? 'arrow path' : null;
  },
};
