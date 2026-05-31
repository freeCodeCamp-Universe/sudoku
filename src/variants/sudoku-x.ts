import { cellId, range } from '@/engine/grid';
import type { BoardLayout, House, Variant } from '@/engine/types';

export const MAIN_DIAGONAL_CELLS = range(9).map((index) => cellId(index, index));
export const ANTI_DIAGONAL_CELLS = range(9).map((index) => cellId(index, 8 - index));

function diagonalHouses(_layout: BoardLayout): House[] {
  return [
    { id: 'diag-main', cells: MAIN_DIAGONAL_CELLS },
    { id: 'diag-anti', cells: ANTI_DIAGONAL_CELLS },
  ];
}

export const sudokuX: Variant = {
  id: 'sudoku-x',
  name: 'Sudoku X',
  description: 'The two main diagonals must also each contain digits 1-9 without repeats.',
  popularity: 4,
  difficulty: 'intermediate',
  layout: { kind: 'grid', size: 9, box: { rows: 3, cols: 3 } },
  symbols: [1, 2, 3, 4, 5, 6, 7, 8, 9],
  constraintIds: ['uniqueness'],
  extraHouses: diagonalHouses,
  overlayIds: ['diagonal'],
  annotatorIds: ['sudoku-x'],
};
