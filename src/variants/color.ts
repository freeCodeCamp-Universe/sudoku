import type { Variant } from '@/engine/types';
import { generateGivens9x9 } from './generateGivens9x9';

const COLOR_NAMES = [
  'Red',
  'Orange',
  'Yellow',
  'Green',
  'Teal',
  'Blue',
  'Purple',
  'Lavender',
  'Silver',
];

export const color: Variant & { colorNames: string[] } = {
  id: 'color',
  name: 'Color Sudoku',
  description:
    'Nine colors replace the digits 1–9. Each color appears once in every row, column, and 3×3 box.',
  help: [
    {
      label: 'Basic Rules',
      tone: 'basic',
      rules: [
        {
          term: 'The board',
          text: 'A 9×9 board divided into nine 3×3 boxes. Fill every cell with a color from 1 to 9.',
        },
        {
          term: 'Rows and columns',
          text: 'Every row and every column must contain each color exactly once.',
        },
        {
          term: 'Boxes',
          text: 'Each of the nine 3×3 boxes must also hold every color exactly once.',
        },
      ],
    },
  ],
  popularity: 15,
  generateGivens: generateGivens9x9,
  difficulty: 'beginner',
  difficultyRank: 8,
  layout: { kind: 'grid', size: 9, box: { rows: 3, cols: 3 } },
  symbols: [1, 2, 3, 4, 5, 6, 7, 8, 9],
  symbolKind: 'color',
  constraintIds: ['uniqueness'],
  overlayIds: [],
  annotatorIds: [],
  colorNames: COLOR_NAMES,
};
