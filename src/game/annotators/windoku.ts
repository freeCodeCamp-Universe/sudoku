import type { CellAnnotator } from '@/game/gameTypes';
import { WINDOKU_WINDOWS } from '@/variants/windoku';

const cellToWindowIndex = new Map<string, number>(
  WINDOKU_WINDOWS.flatMap((window, index) =>
    window.map(([row, col]) => [`r${row}c${col}`, index])
  )
);

export const windokuAnnotator: CellAnnotator = {
  id: 'windoku',
  describe(cellId) {
    const index = cellToWindowIndex.get(cellId);
    return index !== undefined ? `window ${index + 1} of 4` : null;
  },
};
