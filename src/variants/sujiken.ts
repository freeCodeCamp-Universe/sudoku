import { cellId, range } from '@/engine/grid';
import type { BoardLayout, House, TriangularLayout, Variant } from '@/engine/types';

const layout: TriangularLayout = { kind: 'triangular', size: 9 };

function buildDiagonalExtra(boardLayout: BoardLayout): House[] {
  if (boardLayout.kind !== 'triangular') {
    throw new Error(`Unsupported layout kind: ${boardLayout.kind}`);
  }

  return [
    {
      id: 'tri-diagonal',
      cells: range(boardLayout.size).map((index) => cellId(index, index)),
    },
  ];
}

export const sujiken: Variant = {
  id: 'sujiken',
  name: 'Sujiken',
  description:
    'A triangular sudoku where rows, columns, and the main diagonal must each contain distinct digits.',
  help: [
    {
      label: 'Basic Rules',
      tone: 'basic',
      rules: [
        {
          term: 'The shape',
          text: 'A triangular grid built from the upper-left corner of a 9×9 board. Only the cells above and on the main diagonal are used.',
        },
        { term: 'Rows', text: 'Each row must contain distinct digits with no repetition.' },
        {
          term: 'Columns',
          text: 'Each column, counting downward from the diagonal, must also contain distinct digits.',
        },
      ],
    },
    {
      label: 'Additional Rules',
      tone: 'extra',
      rules: [
        {
          term: 'The diagonal',
          text: 'The main diagonal (the longest line of cells) must contain each digit from 1 to 9 exactly once.',
        },
        {
          term: 'Variable range',
          text: 'Shorter rows and columns hold fewer cells, so not every line needs all nine digits. Just no repeats within each.',
        },
      ],
    },
  ],
  popularity: 20,
  difficulty: 'advanced',
  difficultyRank: 12,
  layout,
  symbols: [1, 2, 3, 4, 5, 6, 7, 8, 9],
  symbolKind: 'digit',
  constraintIds: ['uniqueness'],
  overlayIds: [],
  annotatorIds: [],
  extraHouses: buildDiagonalExtra,
};
