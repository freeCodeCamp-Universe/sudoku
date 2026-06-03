import type { CellAnnotator } from '@/game/gameTypes';
import { ARGYLE_D1_OFFSETS, ARGYLE_D2_SUMS } from '@/variants/argyle';

export const argyleAnnotator: CellAnnotator = {
  id: 'argyle',
  describe(cellId) {
    const match = cellId.match(/r(\d+)c(\d+)/);
    if (!match) {
      return null;
    }

    const row = parseInt(match[1], 10);
    const col = parseInt(match[2], 10);

    const onD1 = ARGYLE_D1_OFFSETS.some((n) => n === row - col);
    const onD2 = ARGYLE_D2_SUMS.some((n) => n === row + col);

    const count = (onD1 ? 1 : 0) + (onD2 ? 1 : 0);

    if (count === 2) {
      return 'two argyle diagonals';
    }
    if (count === 1) {
      return 'argyle diagonal';
    }

    return null;
  },
};
