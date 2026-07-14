import { makeGenerateGivens } from './generateGivens9x9';
import type { Variant } from '@/engine/types';

export const mini: Variant = {
  id: 'mini',
  name: '4×4 Sudoku',
  description:
    'A 4×4 grid split into four 2×2 boxes. Fill every row, column, and box with the digits 1–4.',
  help: [
    {
      label: 'Basic Rules',
      tone: 'basic',
      rules: [
        {
          term: 'The board',
          text: 'A 4×4 board split into four 2×2 boxes. Fill every cell with a symbol from 1 to 4.',
        },
        {
          term: 'Rows and columns',
          text: 'Every row and every column must contain each symbol exactly once.',
        },
        { term: 'Boxes', text: 'Each 2×2 box must also hold every symbol exactly once.' },
      ],
    },
  ],
  popularity: 12,
  generateGivens: makeGenerateGivens(4),
  difficulty: 'beginner',
  difficultyRank: 1,
  layout: { kind: 'grid', size: 4, box: { rows: 2, cols: 2 } },
  symbols: [1, 2, 3, 4],
  symbolKind: 'digit',
  constraintIds: ['uniqueness'],
  overlayIds: [],
  annotatorIds: [],
};
