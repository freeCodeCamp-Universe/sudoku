import { cellId, range } from '@/engine/grid';
import type { BoardLayout, House, MultiGridLayout, Variant } from '@/engine/types';

const layout: MultiGridLayout = {
  kind: 'multigrid',
  subGridSize: 9,
  box: { rows: 3, cols: 3 },
  canvasRows: 15,
  canvasCols: 15,
  subGrids: [
    { originRow: 0, originCol: 3 }, // top-center
    { originRow: 6, originCol: 0 }, // bottom-left
    { originRow: 3, originCol: 6 }, // right
  ],
};

function buildGattai3Houses(boardLayout: BoardLayout): House[] {
  if (boardLayout.kind !== 'multigrid') {
    throw new Error(`Unsupported layout kind: ${boardLayout.kind}`);
  }

  const { subGridSize, box, subGrids } = boardLayout;
  const houses: House[] = [];

  for (let gridIndex = 0; gridIndex < subGrids.length; gridIndex += 1) {
    const { originRow, originCol } = subGrids[gridIndex];

    for (let row = 0; row < subGridSize; row += 1) {
      houses.push({
        id: `g${gridIndex}-row-${row}`,
        cells: range(subGridSize).map((col) => cellId(originRow + row, originCol + col)),
      });
    }

    for (let col = 0; col < subGridSize; col += 1) {
      houses.push({
        id: `g${gridIndex}-col-${col}`,
        cells: range(subGridSize).map((row) => cellId(originRow + row, originCol + col)),
      });
    }

    for (let boxRow = 0; boxRow < subGridSize / box.rows; boxRow += 1) {
      for (let boxCol = 0; boxCol < subGridSize / box.cols; boxCol += 1) {
        const cells: string[] = [];

        for (let row = 0; row < box.rows; row += 1) {
          for (let col = 0; col < box.cols; col += 1) {
            cells.push(
              cellId(originRow + boxRow * box.rows + row, originCol + boxCol * box.cols + col)
            );
          }
        }

        houses.push({ id: `g${gridIndex}-box-${boxRow}-${boxCol}`, cells });
      }
    }
  }

  return houses;
}

export const gattai3: Variant = {
  id: 'gattai-3',
  name: 'Gattai-3',
  description:
    'Three 9×9 grids arranged in a triangular cluster, all meeting at a shared central 3×3 box.',
  help: [
    {
      label: 'Basic Rules',
      tone: 'basic',
      rules: [
        {
          term: 'Three grids',
          text: 'Three 9×9 sudoku grids are arranged in a triangular cluster, with a central region where they all meet.',
        },
        {
          term: 'Fill with 1–9',
          text: 'Every cell in each 9×9 grid must contain a digit from 1 to 9.',
        },
        {
          term: 'Standard sudoku',
          text: 'Each row, column, and 3×3 box within a single grid must contain every digit exactly once.',
        },
      ],
    },
    {
      label: 'Additional Rules',
      tone: 'extra',
      rules: [
        {
          term: 'Shared regions',
          text: 'Where any grids overlap, those cells must satisfy the rules of all grids simultaneously.',
        },
        {
          term: 'Solve as one',
          text: 'The extensive shared regions tightly link all grids; progress in any one immediately constrains the others.',
        },
        {
          term: 'Candidate mode',
          text: 'Candidates are small numbers you pencil into a cell to track which values are possible there.',
        },
      ],
    },
  ],
  popularity: 20,
  difficulty: 'advanced',
  difficultyRank: 10,
  tags: ['multidoku'],
  layout,
  symbols: [1, 2, 3, 4, 5, 6, 7, 8, 9],
  symbolKind: 'digit',
  constraintIds: ['uniqueness'],
  overlayIds: [],
  annotatorIds: ['overlap'],
  buildHouses: buildGattai3Houses,
};
