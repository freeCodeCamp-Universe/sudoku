import type { Chain } from '@/engine/constraints/chain';
import type { CellAnnotator } from '@/game/gameTypes';

function getChains(ctx: Parameters<CellAnnotator['describe']>[1]): Chain[] {
  const structure = ctx.model.structure as { chains?: Chain[] } | undefined;

  return structure?.chains ?? [];
}

export const chainAnnotator: CellAnnotator = {
  id: 'chain-cell',
  describe(cellId, ctx) {
    const match = getChains(ctx).find((chain) => chain.cells.includes(cellId));

    if (!match) {
      return null;
    }

    return `in a chain of ${match.cells.length} cells, values must form a consecutive range`;
  },
};
