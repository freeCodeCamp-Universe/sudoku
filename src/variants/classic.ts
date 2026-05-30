import type { Variant } from '@/engine/types';

export const classic: Variant = {
  id: 'classic',
  name: 'Classic Sudoku',
  difficulty: 'intermediate',
  layout: { kind: 'grid', size: 9, box: { rows: 3, cols: 3 } },
  symbols: [1, 2, 3, 4, 5, 6, 7, 8, 9],
  symbolKind: 'digit',
  constraintIds: ['uniqueness'],
  overlayIds: [],
  annotatorIds: [],
};
