import type { Variant } from '@/engine/types';

export const classic: Variant = {
  id: 'classic',
  name: 'Classic Sudoku',
  description: 'The standard 9x9 puzzle. Fill every row, column, and 3x3 box with digits 1-9.',
  popularity: 1,
  difficulty: 'intermediate',
  layout: { kind: 'grid', size: 9, box: { rows: 3, cols: 3 } },
  symbols: [1, 2, 3, 4, 5, 6, 7, 8, 9],
  symbolKind: 'digit',
  constraintIds: ['uniqueness'],
  overlayIds: [],
  annotatorIds: [],
};
