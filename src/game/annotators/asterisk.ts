import type { CellAnnotator } from '@/game/gameTypes';
import { ASTERISK_CELLS } from '@/variants/asterisk';

const asteriskCells = new Set(ASTERISK_CELLS.map(([row, col]) => `r${row}c${col}`));

export const asteriskAnnotator: CellAnnotator = {
  id: 'asterisk',
  describe(cellId) {
    return asteriskCells.has(cellId) ? 'asterisk region' : null;
  },
};
