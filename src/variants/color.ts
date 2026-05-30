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
  difficulty: 'intermediate',
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
