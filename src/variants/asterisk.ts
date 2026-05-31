import { cellId } from '@/engine/grid';
import type { BoardLayout, House, Variant } from '@/engine/types';

export const ASTERISK_CELLS: [number, number][] = [
  [1, 4], [2, 2], [2, 6],
  [4, 1], [4, 4], [4, 7],
  [6, 2], [6, 6], [7, 4],
];

function asteriskExtraHouses(_layout: BoardLayout): House[] {
  return [
    {
      id: 'asterisk',
      cells: ASTERISK_CELLS.map(([row, col]) => cellId(row, col)),
    },
  ];
}

export const asterisk: Variant = {
  id: 'asterisk',
  name: 'Asterisk Sudoku',
  description: 'Nine cells forming a star must contain each digit 1–9, on top of standard sudoku rules.',
  popularity: 16,
  difficulty: 'advanced',
  layout: { kind: 'grid', size: 9, box: { rows: 3, cols: 3 } },
  symbols: [1, 2, 3, 4, 5, 6, 7, 8, 9],
  constraintIds: ['uniqueness'],
  extraHouses: asteriskExtraHouses,
  overlayIds: ['asterisk'],
  annotatorIds: ['asterisk'],
};
