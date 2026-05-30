import type { CellAnnotator } from '@/game/gameTypes';
import { ANTI_DIAGONAL_CELLS, MAIN_DIAGONAL_CELLS } from '@/variants/sudoku-x';

const mainDiagonal = new Set(MAIN_DIAGONAL_CELLS);
const antiDiagonal = new Set(ANTI_DIAGONAL_CELLS);

export const sudokuXAnnotator: CellAnnotator = {
  id: 'sudoku-x',
  describe(cellId) {
    const onMain = mainDiagonal.has(cellId);
    const onAnti = antiDiagonal.has(cellId);

    if (onMain && onAnti) {
      return 'on both diagonals';
    }

    if (onMain) {
      return 'on main diagonal';
    }

    if (onAnti) {
      return 'on anti-diagonal';
    }

    return null;
  },
};
