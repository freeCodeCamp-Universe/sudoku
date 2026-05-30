import type { CellAnnotator } from '@/game/gameTypes';
import { WINDOKU_WINDOWS } from '@/variants/windoku';

const windowCells = new Set(
  WINDOKU_WINDOWS.flatMap((window) => window.map(([row, col]) => `r${row}c${col}`))
);

export const windokuAnnotator: CellAnnotator = {
  id: 'windoku',
  describe(cellId) {
    return windowCells.has(cellId) ? 'shaded region' : null;
  },
};
