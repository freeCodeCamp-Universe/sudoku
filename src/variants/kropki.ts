import { cellId, range } from '@/engine/grid';
import type { KropkiMark } from '@/engine/constraints/kropki';
import type { CellId, Solution, Variant, VariantModel } from '@/engine/types';
import { generateGivens9x9 } from './generateGivens9x9';

function addMark(
  solution: Solution,
  a: CellId,
  b: CellId,
  marks: KropkiMark[],
): void {
  const va = solution.get(a);
  const vb = solution.get(b);

  if (va === undefined || vb === undefined) return;

  if (va === 2 * vb || vb === 2 * va) {
    marks.push({ a, b, kind: 'black' });
  } else if (Math.abs(va - vb) === 1) {
    marks.push({ a, b, kind: 'white' });
  }
}

function deriveStructure(
  solution: Solution,
  _model: VariantModel,
): { kropkiMarks: KropkiMark[] } {
  const marks: KropkiMark[] = [];

  for (const row of range(9)) {
    for (const col of range(8)) {
      addMark(solution, cellId(row, col) as CellId, cellId(row, col + 1) as CellId, marks);
    }
  }

  for (const row of range(8)) {
    for (const col of range(9)) {
      addMark(solution, cellId(row, col) as CellId, cellId(row + 1, col) as CellId, marks);
    }
  }

  return { kropkiMarks: marks };
}

export const kropki: Variant = {
  id: 'kropki',
  name: 'Kropki Sudoku',
  description: 'White dots mean consecutive digits, filled dots mean a 1:2 ratio, and no dot means neither applies.',
  help: [
    {
      label: 'Basic Rules',
      tone: 'basic',
      rules: [
        { term: 'The grid', text: 'A standard 9×9 sudoku. Fill every row, column, and 3×3 box with digits 1–9.' },
        { term: 'White dot', text: 'A white dot between two cells means their digits are consecutive, differing by exactly 1 (e.g. 4 and 5).' },
        { term: 'Filled dot', text: 'A filled dot means one digit is exactly double the other (e.g. 2 and 4, or 3 and 6).' },
      ],
    },
    {
      label: 'Additional Rules',
      tone: 'extra',
      rules: [
        { term: 'No dot', text: 'When two adjacent cells have no dot, their digits must be neither consecutive nor in a 1:2 ratio.' },
        { term: 'Special case', text: 'The pair 1 and 2 satisfies both relationships, so it always receives a filled dot.' },
      ],
    },
  ],
  popularity: 15,
  generateGivens: generateGivens9x9,
  difficulty: 'beginner',
  difficultyRank: 6,
  layout: { kind: 'grid', size: 9, box: { rows: 3, cols: 3 } },
  symbols: [1, 2, 3, 4, 5, 6, 7, 8, 9],
  symbolKind: 'digit',
  constraintIds: ['uniqueness', 'kropki'],
  overlayIds: ['kropki-dots'],
  annotatorIds: ['kropki-cell'],
  deriveStructure,
};
