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

    const index = arrows.findIndex((arrow) => arrow.bulb === cellId);
    if (index === -1) {
      return null;
    }

    const arrow = arrows[index];
    const n = arrow.path.length;
    const label = arrows.length > 1 ? `arrow ${index + 1} circle` : 'arrow circle';
    return `${label}, equals the sum of the ${n} ${n === 1 ? 'cell' : 'cells'} along its arrow`;
  },
};

export const arrowPathAnnotator: CellAnnotator = {
  id: 'arrow-path',
  describe(cellId, ctx) {
    const arrows = getArrows(ctx);
    if (!arrows) {
      return null;
    }

    const index = arrows.findIndex((arrow) => arrow.path.includes(cellId));
    if (index === -1) {
      return null;
    }

    const label = arrows.length > 1 ? `arrow ${index + 1} path` : 'arrow path';
    return `${label}, contributes to its circle's sum`;
  },
};
