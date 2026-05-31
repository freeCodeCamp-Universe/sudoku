import type { Variant } from '@/engine/types';

export const mini: Variant = {
  id: 'mini',
  name: 'Mini Sudoku',
  description: '4x4 grid with numbers 1-4. The simplest form of sudoku, great for beginners.',
  difficulty: 'beginner',
  layout: { kind: 'grid', size: 4, box: { rows: 2, cols: 2 } },
  symbols: [1, 2, 3, 4],
  symbolKind: 'digit',
  constraintIds: ['uniqueness'],
  overlayIds: [],
  annotatorIds: [],
};
