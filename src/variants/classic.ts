import { generateGivens9x9 } from './generateGivens9x9';
import type { Variant } from '@/engine/types';

export const classic: Variant = {
  id: 'classic',
  name: 'Classic Sudoku',
  description:
    'The classic 9×9 puzzle. Fill every row, column, and 3×3 box with each of the digits 1–9.',
  generateGivens: generateGivens9x9,
  popularity: 1,
  difficulty: 'intermediate',
  difficultyRank: 3,
  layout: { kind: 'grid', size: 9, box: { rows: 3, cols: 3 } },
  symbols: [1, 2, 3, 4, 5, 6, 7, 8, 9],
  symbolKind: 'digit',
  constraintIds: ['uniqueness'],
  overlayIds: [],
  annotatorIds: [],
};
