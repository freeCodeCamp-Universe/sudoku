import type { CellId, Solution, Variant, VariantModel } from '@/engine/types';
import { generateGivens9x9 } from './generateGivens9x9';

export const evenOdd: Variant = {
  id: 'even-odd',
  name: 'Even-Odd Sudoku',
  description: 'Shaded cells must contain even digits and unshaded cells must contain odd digits across the grid.',
  help: [
    {
      label: 'Basic Rules',
      tone: 'basic',
      rules: [
        { term: 'The grid', text: 'A standard 9×9 sudoku. Fill every row, column, and 3×3 box with digits 1–9.' },
        { term: 'Shaded cells', text: 'Shaded cells must contain an even digit (2, 4, 6, or 8).' },
        { term: 'Unshaded cells', text: 'Unshaded cells must contain an odd digit (1, 3, 5, 7, or 9).' },
      ],
    },
    {
      label: 'Additional Rules',
      tone: 'extra',
      rules: [
        { term: 'Fixed parity', text: 'The even/odd pattern is set by the puzzle. Every cell\'s parity is determined before you start.' },
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
  overlayIds: ['evenOdd-shading'],
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
