import { cellId } from '@/engine/grid';
import type { BoardLayout, House, Variant } from '@/engine/types';
import { generateGivens9x9 } from './generateGivens9x9';

export const ASTERISK_CELLS: [number, number][] = [
  [1, 4],
  [2, 2],
  [2, 6],
  [4, 1],
  [4, 4],
  [4, 7],
  [6, 2],
  [6, 6],
  [7, 4],
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
  description:
    'Nine cells in a star pattern form an extra region that must contain each of the digits 1–9.',
  help: [
    {
      label: 'Basic Rules',
      tone: 'basic',
      rules: [
        {
          term: 'The grid',
          text: 'A standard 9×9 sudoku. Fill every row, column, and 3×3 box with digits 1–9.',
        },
        {
          term: 'The asterisk',
          text: 'Nine specific cells form a star shape across the grid, marked by highlighting.',
        },
        {
          term: 'Star rule',
          text: 'The nine asterisk cells must together contain each digit from 1 to 9 exactly once.',
        },
      ],
    },
    {
      label: 'Additional Rules',
      tone: 'extra',
      rules: [
        {
          term: 'Double duty',
          text: 'Each asterisk cell still belongs to its own row, column, and box, so it must satisfy all those constraints as well as the star.',
        },
      ],
    },
  ],
  popularity: 16,
  generateGivens: generateGivens9x9,
  difficulty: 'intermediate',
  difficultyRank: 8,
  layout: { kind: 'grid', size: 9, box: { rows: 3, cols: 3 } },
  symbols: [1, 2, 3, 4, 5, 6, 7, 8, 9],
  constraintIds: ['uniqueness'],
  extraHouses: asteriskExtraHouses,
  overlayIds: [],
  annotatorIds: ['asterisk'],
};
