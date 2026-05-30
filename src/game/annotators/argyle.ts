import type { CellAnnotator } from '@/game/gameTypes';
import { isArgyleCell } from '@/variants/argyle';

export const argyleAnnotator: CellAnnotator = {
  id: 'argyle',
  describe(cellId) {
    return isArgyleCell(cellId) ? 'argyle region' : null;
  },
};
