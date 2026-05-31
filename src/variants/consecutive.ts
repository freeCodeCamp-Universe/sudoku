import { cellId, range } from '@/engine/grid';
import type { CellId, Solution, Variant, VariantModel } from '@/engine/types';
import type { Mark } from '@/engine/constraints/consecutive';

function deriveStructure(solution: Solution, _model: VariantModel): { marks: Mark[] } {
  const marks: Mark[] = [];

  for (const row of range(9)) {
    for (const col of range(8)) {
      const a = cellId(row, col) as CellId;
      const b = cellId(row, col + 1) as CellId;

      if (Math.abs((solution.get(a) ?? 0) - (solution.get(b) ?? 0)) === 1) {
        marks.push({ a, b });
      }
    }
  }

  for (const row of range(8)) {
    for (const col of range(9)) {
      const a = cellId(row, col) as CellId;
      const b = cellId(row + 1, col) as CellId;

      if (Math.abs((solution.get(a) ?? 0) - (solution.get(b) ?? 0)) === 1) {
        marks.push({ a, b });
      }
    }
  }

  return { marks };
}

export const consecutiveVariant: Variant = {
  id: 'consecutive',
  name: 'Consecutive Sudoku',
  description: 'White dots mark adjacent pairs that differ by exactly 1. Pairs without a dot must not be consecutive.',
  help: [
    {
      label: 'Basic Rules',
      tone: 'basic',
      rules: [
        { term: 'The grid', text: 'A standard 9×9 sudoku. Fill every row, column, and 3×3 box with digits 1–9.' },
        { term: 'White dots', text: 'A dot between two adjacent cells means those digits differ by exactly 1 (e.g. 4 and 5).' },
        { term: 'No dot', text: 'When two adjacent cells have no dot, their digits must not differ by exactly 1.' },
      ],
    },
    {
      label: 'Additional Rules',
      tone: 'extra',
      rules: [
        { term: 'Both directions matter', text: 'Dots mark consecutive pairs and missing dots rule them out. Use both pieces of information to solve the puzzle.' },
      ],
    },
  ],
  popularity: 9,
  difficulty: 'intermediate',
  layout: { kind: 'grid', size: 9, box: { rows: 3, cols: 3 } },
  symbols: [1, 2, 3, 4, 5, 6, 7, 8, 9],
  symbolKind: 'digit',
  constraintIds: ['uniqueness', 'consecutive'],
  overlayIds: ['consecutive-dots'],
  annotatorIds: ['consecutive-cell'],
  deriveStructure,
};
