import type { SymbolValue, Variant } from '@/engine/types';

export const COLOR_PALETTE = [
  '#e03535',
  '#f07820',
  '#d4a828',
  '#33a850',
  '#1aabaa',
  '#3a80e0',
  '#8e52e8',
  '#d94080',
  '#9898b0',
];

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
  description: 'Nine colors replace the digits 1-9. Each color must appear exactly once in every row, column, and 3x3 box.',
  help: [
    {
      label: 'Basic Rules',
      tone: 'basic',
      rules: [
        { term: 'The grid', text: 'A 9×9 board where nine colors replace the digits 1–9. The logic is identical to classic sudoku.' },
        { term: 'Rows and columns', text: 'Each row and column must contain every color exactly once.' },
        { term: 'Boxes', text: 'Each 3×3 box must also hold every color exactly once.' },
      ],
    },
    {
      label: 'Additional Rules',
      tone: 'extra',
      rules: [
        { term: 'Filling cells', text: 'Click a color in the palette, then click a cell to paint it. Click the same color on a filled cell to erase it.' },
        { term: 'Given colors', text: 'Cells with a small dot are pre-filled and cannot be changed.' },
      ],
    },
  ],
  popularity: 15,
  difficulty: 'beginner',
  layout: { kind: 'grid', size: 9, box: { rows: 3, cols: 3 } },
  symbols: [1, 2, 3, 4, 5, 6, 7, 8, 9],
  symbolKind: 'color',
  constraintIds: ['uniqueness'],
  overlayIds: [],
  annotatorIds: [],
  renderSymbol(value: SymbolValue): string {
    return COLOR_PALETTE[value - 1] ?? '#000000';
  },
  colorNames: COLOR_NAMES,
};
