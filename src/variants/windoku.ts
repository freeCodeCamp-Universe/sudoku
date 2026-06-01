import { cellId } from '@/engine/grid';
import type { BoardLayout, House, Variant } from '@/engine/types';

export const WINDOKU_WINDOWS: [number, number][][] = [
  [
    [1, 1], [1, 2], [1, 3],
    [2, 1], [2, 2], [2, 3],
    [3, 1], [3, 2], [3, 3],
  ],
  [
    [1, 5], [1, 6], [1, 7],
    [2, 5], [2, 6], [2, 7],
    [3, 5], [3, 6], [3, 7],
  ],
  [
    [5, 1], [5, 2], [5, 3],
    [6, 1], [6, 2], [6, 3],
    [7, 1], [7, 2], [7, 3],
  ],
  [
    [5, 5], [5, 6], [5, 7],
    [6, 5], [6, 6], [6, 7],
    [7, 5], [7, 6], [7, 7],
  ],
];

function windokuExtraHouses(_layout: BoardLayout): House[] {
  return WINDOKU_WINDOWS.map((cells, index) => ({
    id: `window-${index}`,
    cells: cells.map(([row, col]) => cellId(row, col)),
  }));
}

export const windoku: Variant = {
  id: 'windoku',
  name: 'Windoku',
  description: 'Four extra shaded 3x3 window regions must each contain digits 1-9, on top of the normal rules.',
  help: [
    {
      label: 'Basic Rules',
      tone: 'basic',
      rules: [
        { term: 'The grid', text: 'A standard 9×9 sudoku. Fill every row, column, and 3×3 box with digits 1–9.' },
        { term: 'Four windows', text: 'Four extra shaded 3×3 regions are overlaid on the grid.' },
        { term: 'Window rule', text: 'Each window must also contain digits 1–9 without any repeats.' },
      ],
    },
    {
      label: 'Additional Rules',
      tone: 'extra',
      rules: [
        { term: 'Linked constraints', text: 'Placing a digit in one window limits where it can go in the others, creating a chain of extra deductions across the board.' },
      ],
    },
  ],
  popularity: 6,
  difficulty: 'intermediate',
  layout: { kind: 'grid', size: 9, box: { rows: 3, cols: 3 } },
  symbols: [1, 2, 3, 4, 5, 6, 7, 8, 9],
  constraintIds: ['uniqueness'],
  extraHouses: windokuExtraHouses,
  overlayIds: [],
  annotatorIds: ['windoku'],
};
