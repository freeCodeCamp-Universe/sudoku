import type { CellAnnotator } from '@/game/gameTypes';
import { GIRANDOLA_CELLS } from '@/variants/girandola';

const girandolaCells = new Set(GIRANDOLA_CELLS.map(([row, col]) => `r${row}c${col}`));

export const girandolaAnnotator: CellAnnotator = {
  id: 'girandola',
  describe(cellId) {
    return girandolaCells.has(cellId) ? 'girandola region' : null;
  },
};
