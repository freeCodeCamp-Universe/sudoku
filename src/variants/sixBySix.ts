import { makeGenerateGivens } from './generateGivens9x9';
import type { Variant } from '@/engine/types';

export const sixBySix: Variant = {
  id: 'six-by-six',
  name: '6×6 Sudoku',
  description:
    'A 6×6 grid split into 2×3 boxes. Fill every row, column, and box with each digit from 1–6.',
  help: [
    {
      label: 'Basic Rules',
      tone: 'basic',
      rules: [
        {
          term: 'The board',
          text: 'A 6×6 board split into six 2×3 boxes. Fill every cell with a symbol from 1 to 6.',
        },
        {
          term: 'Rows and columns',
          text: 'Every row and every column must contain each symbol exactly once.',
        },
        { term: 'Boxes', text: 'Each 2×3 box must also hold every symbol exactly once.' },
      ],
    },
  ],
  popularity: 11,
  generateGivens: makeGenerateGivens(12),
  difficulty: 'beginner',
  difficultyRank: 2,
  layout: { kind: 'grid', size: 6, box: { rows: 2, cols: 3 } },
  symbols: [1, 2, 3, 4, 5, 6],
  symbolKind: 'digit',
  constraintIds: ['uniqueness'],
  overlayIds: [],
  annotatorIds: [],
};
