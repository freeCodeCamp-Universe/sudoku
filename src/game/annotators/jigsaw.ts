import type { CellAnnotator } from '@/game/gameTypes';
import type { JigsawStructure } from '@/variants/jigsaw';

export function jigsawAnnotator(structure: JigsawStructure): CellAnnotator {
  return {
    id: 'jigsaw',
    describe(cellId) {
      const match = /^r(\d+)c(\d+)$/.exec(cellId);

      if (!match) {
        return null;
      }

      const row = Number.parseInt(match[1], 10);
      const col = Number.parseInt(match[2], 10);
      const region = structure.regions[row]?.[col];

      return region === undefined ? null : `region ${region}`;
    },
  };
}

export const jigsawAnnotatorPlaceholder: CellAnnotator = {
  id: 'jigsaw',
  describe() {
    return null;
  },
};
