import type { Chain } from '@/engine/constraints/chain';
import type { CellAnnotator } from '@/game/gameTypes';

function getChains(ctx: Parameters<CellAnnotator['describe']>[1]): Chain[] {
  const structure = ctx.model.structure as { chains?: Chain[] } | undefined;

  return structure?.chains ?? [];
}

export const chainAnnotator: CellAnnotator = {
  id: 'chain-cell',
  describe(cellId, ctx) {
    const chains = getChains(ctx);
    const index = chains.findIndex((chain) => chain.cells.includes(cellId));

    if (index === -1) {
      return null;
    }

    const total = chains.length;
    const size = chains[index].cells.length;

    if (total > 1) {
      return `chain ${index + 1} of ${total}, ${size} cells`;
    }

    return `chain of ${size} cells`;
  },
};
