import { cellId } from '@/engine/grid';
import type { BoardLayout, House, Variant } from '@/engine/types';
import { generateGivens9x9 } from './generateGivens9x9';

export const GIRANDOLA_CELLS: [number, number][] = [
  [0, 0],
  [0, 8],
  [1, 4],
  [4, 1],
  [4, 4],
  [4, 7],
  [7, 4],
  [8, 0],
  [8, 8],
];

function girandolaExtraHouse(_layout: BoardLayout): House[] {
  return [
    {
      id: 'girandola',
      cells: GIRANDOLA_CELLS.map(([row, col]) => cellId(row, col)),
    },
  ];
}

export const girandola: Variant = {
  id: 'girandola',
  name: 'Girandola Sudoku',
  description:
    'A pinwheel-shaped extra region of nine cells must contain each of the digits 1–9 exactly once.',
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
          term: 'The girandola',
          text: 'Nine specific cells form a pinwheel shape across the grid, marked by highlighting.',
        },
        {
          term: 'Girandola rule',
          text: 'The nine highlighted cells must together contain each digit from 1 to 9 exactly once.',
        },
      ],
    },
    {
      label: 'Additional Rules',
      tone: 'extra',
      rules: [
        {
          term: 'Double duty',
          text: 'Each girandola cell still belongs to its own row, column, and box, so it must satisfy all standard constraints as well as the girandola.',
        },
      ],
    },
  ],
  popularity: 12,
  generateGivens: generateGivens9x9,
  difficulty: 'intermediate',
  difficultyRank: 7,
  layout: { kind: 'grid', size: 9, box: { rows: 3, cols: 3 } },
  symbols: [1, 2, 3, 4, 5, 6, 7, 8, 9],
  symbolKind: 'digit',
  constraintIds: ['uniqueness'],
  extraHouses: girandolaExtraHouse,
  overlayIds: [],
  annotatorIds: ['girandola'],
};
