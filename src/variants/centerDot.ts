import { cellId } from '@/engine/grid';
import type { BoardLayout, House, Variant } from '@/engine/types';
import { generateGivens9x9 } from './generateGivens9x9';

export const CENTER_DOT_CELLS: [number, number][] = [
  [1, 1], [1, 4], [1, 7],
  [4, 1], [4, 4], [4, 7],
  [7, 1], [7, 4], [7, 7],
];

function centerDotExtraHouse(_layout: BoardLayout): House[] {
  return [
    {
      id: 'center-dot',
      cells: CENTER_DOT_CELLS.map(([row, col]) => cellId(row, col)),
    },
  ];
}

export const centerDot: Variant = {
  id: 'center-dot',
  name: 'Center Dot Sudoku',
  description: 'All nine center cells, one per 3×3 box, must together contain each of the digits 1–9 once.',
  help: [
    {
      label: 'Basic Rules',
      tone: 'basic',
      rules: [
        { term: 'The grid', text: 'A standard 9×9 sudoku. Fill every row, column, and 3×3 box with digits 1–9.' },
        { term: 'Center cells', text: 'The nine center cells (one per box) are highlighted.' },
        { term: 'Center rule', text: 'The nine highlighted cells must together contain each digit from 1 to 9 exactly once.' },
      ],
    },
    {
      label: 'Additional Rules',
      tone: 'extra',
      rules: [
        { term: 'Double duty', text: 'Each center cell still belongs to its own row, column, and box, so it must satisfy all standard constraints as well as the center group.' },
      ],
    },
  ],
  popularity: 12,
  generateGivens: generateGivens9x9,
  difficulty: 'intermediate',
  difficultyRank: 6,
  layout: { kind: 'grid', size: 9, box: { rows: 3, cols: 3 } },
  symbols: [1, 2, 3, 4, 5, 6, 7, 8, 9],
  symbolKind: 'digit',
  constraintIds: ['uniqueness'],
  extraHouses: centerDotExtraHouse,
  overlayIds: [],
  annotatorIds: ['center-dot'],
};
