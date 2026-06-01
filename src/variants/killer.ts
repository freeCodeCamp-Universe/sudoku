import type { Solution, Variant, VariantModel } from '@/engine/types';
import type { Cage } from '@/game/gameTypes';

const ROW_PATTERNS: number[][] = [
  [2, 2, 2, 3],
  [3, 2, 2, 2],
  [2, 3, 2, 2],
  [2, 2, 3, 2],
];

function carveCages(solution: Solution, _model: VariantModel): { cages: Cage[] } {
  const cages: Cage[] = [];

  for (let row = 0; row < 9; row += 1) {
    const pattern = ROW_PATTERNS[row % ROW_PATTERNS.length];
    let col = 0;

    for (const length of pattern) {
      const cells = Array.from({ length }, (_, offset) => `r${row}c${col + offset}`);
      const sum = cells.reduce((total, cellId) => total + (solution.get(cellId) ?? 0), 0);

      cages.push({ cells, sum });
      col += length;
    }
  }

  return { cages };
}

export const killer: Variant = {
  id: 'killer',
  name: 'Killer Sudoku',
  description: 'Cells are grouped into dashed cages with target sums. Digits in each cage must add up to the total without repeating.',
  help: [
    {
      label: 'Basic Rules',
      tone: 'basic',
      rules: [
        { term: 'The grid', text: 'A standard 9×9 sudoku. Fill every row, column, and 3×3 box with digits 1–9.' },
        { term: 'Cages', text: 'Cells are grouped into dashed cages, each with a small target number in its corner.' },
        { term: 'Sum rule', text: 'The digits inside each dashed cage must add up to that target exactly.' },
      ],
    },
    {
      label: 'Additional Rules',
      tone: 'extra',
      rules: [
        { term: 'No repeats in cages', text: 'A digit may not appear twice within the same cage, even if sudoku rules would otherwise allow it.' },
        { term: 'No givens', text: 'There are no pre-filled cells. The cages and their sums are your only starting clues.' },
      ],
    },
  ],
  popularity: 2,
  difficulty: 'advanced',
  layout: { kind: 'grid', size: 9, box: { rows: 3, cols: 3 } },
  symbols: [1, 2, 3, 4, 5, 6, 7, 8, 9],
  symbolKind: 'digit',
  constraintIds: ['uniqueness', 'cageSum'],
  overlayIds: ['cage'],
  annotatorIds: ['cage-sum'],
  deriveStructure: carveCages,
  generateGivens() {
    return new Map();
  },
};
