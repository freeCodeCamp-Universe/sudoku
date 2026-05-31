import type { Variant } from '@/engine/types';

export const classic: Variant = {
  id: 'classic',
  name: 'Classic Sudoku',
  description: 'The standard 9x9 puzzle. Fill every row, column, and 3x3 box with digits 1-9.',
  help: [
    {
      label: 'Basic Rules',
      tone: 'basic',
      rules: [
        { term: 'The grid', text: 'A 9×9 board divided into nine 3×3 boxes. Fill every cell with a digit from 1 to 9.' },
        { term: 'Rows and columns', text: 'Every row and every column must contain each digit exactly once.' },
        { term: 'Boxes', text: 'Each of the nine 3×3 boxes must also hold every digit exactly once.' },
      ],
    },
    {
      label: 'Additional Rules',
      tone: 'extra',
      rules: [
        { term: 'Given digits', text: 'Some cells are pre-filled and cannot be changed. Use them as your starting clues.' },
        { term: 'Entering digits', text: 'Click a cell to select it, then press a digit key or tap the numpad.' },
        { term: 'Erasing', text: 'Press Backspace or tap the Erase button to clear a cell.' },
      ],
    },
  ],
  popularity: 1,
  difficulty: 'intermediate',
  layout: { kind: 'grid', size: 9, box: { rows: 3, cols: 3 } },
  symbols: [1, 2, 3, 4, 5, 6, 7, 8, 9],
  symbolKind: 'digit',
  constraintIds: ['uniqueness'],
  overlayIds: [],
  annotatorIds: [],
};
