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
  'Pink',
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
          term: 'The grid',
          text: 'A 9×9 board where nine colors replace the digits 1–9. The logic is identical to classic sudoku.',
        },
        {
          term: 'Rows and columns',
          text: 'Each row and column must contain every color exactly once.',
        },
        { term: 'Boxes', text: 'Each 3×3 box must also hold every color exactly once.' },
      ],
    },
    {
      label: 'Additional Rules',
      tone: 'extra',
      rules: [
        {
          term: 'Filling cells',
          text: 'Click a color in the palette, then click a cell to paint it. Click the same color on a filled cell to erase it.',
        },
        {
          term: 'Given colors',
          text: 'Cells with a small dot are pre-filled and cannot be changed.',
        },
        {
          term: 'Candidate mode',
          text: 'Candidates are small numbers you pencil into a cell to track which values are possible there.',
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
