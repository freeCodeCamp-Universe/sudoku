import type { CellId, Solution, Variant, VariantModel } from '@/engine/types';
import { generateGivens9x9 } from './generateGivens9x9';

export const evenOdd: Variant = {
  id: 'even-odd',
  name: 'Even-Odd Sudoku',
  description:
    'Shaded cells must contain even digits and unshaded cells must contain odd digits across the board.',
  help: [
    {
      label: 'Additional Rules',
      tone: 'extra',
      rules: [
        { term: 'Shaded cells', text: 'Shaded cells must contain an even symbol (2, 4, 6, or 8).' },
        {
          term: 'Unshaded cells',
          text: 'Unshaded cells must contain an odd symbol (1, 3, 5, 7, or 9).',
        },
      ],
    },
  ],
  popularity: 8,
  generateGivens: generateGivens9x9,
  difficulty: 'beginner',
  difficultyRank: 3,
  layout: { kind: 'grid', size: 9, box: { rows: 3, cols: 3 } },
  symbols: [1, 2, 3, 4, 5, 6, 7, 8, 9],
  symbolKind: 'digit',
  constraintIds: ['uniqueness', 'evenOdd'],
  annotatorIds: ['even-cell', 'odd-cell'],
  deriveStructure(solution: Solution, model: VariantModel): { parityMap: Map<CellId, 0 | 1> } {
    const parityMap = new Map<CellId, 0 | 1>();

    for (const cell of model.cells) {
      const value = solution.get(cell.id);

      if (value !== undefined) {
        parityMap.set(cell.id, (value % 2) as 0 | 1);
      }
    }

    return { parityMap };
  },
};
