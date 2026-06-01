import type { CellId } from '@/engine/types';
import type { CellAnnotator } from '@/game/gameTypes';

function getParityMap(
  ctx: Parameters<CellAnnotator['describe']>[1]
): Map<CellId, 0 | 1> | undefined {
  const structure = ctx.model.structure as { parityMap?: Map<CellId, 0 | 1> } | undefined;

  return structure?.parityMap;
}

export const evenCellAnnotator: CellAnnotator = {
  id: 'even-cell',
  describe(cellId, ctx) {
    const parityMap = getParityMap(ctx);

    if (!parityMap) {
      return null;
    }

    return parityMap.get(cellId) === 0 ? 'even cell' : null;
  },
};

export const oddCellAnnotator: CellAnnotator = {
  id: 'odd-cell',
  describe(cellId, ctx) {
    const parityMap = getParityMap(ctx);

    if (!parityMap) {
      return null;
    }

    return parityMap.get(cellId) === 1 ? 'odd cell' : null;
  },
};
