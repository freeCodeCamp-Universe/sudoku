import type { CellAnnotator } from '@/game/gameTypes';
import { CENTER_DOT_CELLS } from '@/variants/centerDot';

const centerDotCells = new Set(CENTER_DOT_CELLS.map(([row, col]) => `r${row}c${col}`));

export const centerDotAnnotator: CellAnnotator = {
  id: 'center-dot',
  describe(cellId) {
    return centerDotCells.has(cellId) ? 'center dot region' : null;
  },
};
