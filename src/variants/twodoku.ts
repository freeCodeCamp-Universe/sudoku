import { cellId, range } from '@/engine/grid';
import type { BoardLayout, House, MultiGridLayout, Variant } from '@/engine/types';

const layout: MultiGridLayout = {
  kind: 'multigrid',
  subGridSize: 9,
  box: { rows: 3, cols: 3 },
  canvasRows: 15,
  canvasCols: 15,
  subGrids: [
    { originRow: 0, originCol: 0 },
    { originRow: 6, originCol: 6 },
  ],
};

function buildTwodokuHouses(boardLayout: BoardLayout): House[] {
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

export const twodoku: Variant = {
  id: 'twodoku',
  name: 'Twodoku',
  description:
    'Two 9×9 grids sharing a single 3×3 corner box, linked through their overlapping region.',
  help: [
    {
      label: 'Basic Rules',
      tone: 'basic',
      rules: [
        {
          term: 'Board',
          text: 'Two 9×9 boards placed diagonally, overlapping at one corner 3×3 box.',
        },
        {
          term: 'Fill with 1 to 9',
          text: 'Every cell in each 9×9 board must contain a symbol from 1 to 9. Each row, column, and 3×3 box within a single board must contain every symbol exactly once.',
        },
      ],
    },
    {
      label: 'Additional Rules',
      tone: 'extra',
      rules: [
        {
          term: 'Shared regions',
          text: 'Cells in the overlap belong to multiple boards simultaneously and must satisfy the rules of each one.',
        },
        {
          term: 'Solve as one',
          text: 'Both boards are linked through their shared cells, so they must both be solved together.',
        },
      ],
    },
  ],
  popularity: 22,
  difficulty: 'intermediate',
  difficultyRank: 4,
  tags: ['multidoku'],
  layout,
  symbols: [1, 2, 3, 4, 5, 6, 7, 8, 9],
  symbolKind: 'digit',
  constraintIds: ['uniqueness'],
  overlayIds: [],
  annotatorIds: ['overlap'],
  buildHouses: buildTwodokuHouses,
};
