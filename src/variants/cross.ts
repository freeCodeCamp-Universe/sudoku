import { cellId, range } from '@/engine/grid';
import type { BoardLayout, House, MultiGridLayout, Variant } from '@/engine/types';

const layout: MultiGridLayout = {
  kind: 'multigrid',
  subGridSize: 9,
  box: { rows: 3, cols: 3 },
  canvasRows: 21,
  canvasCols: 21,
  subGrids: [
    { originRow: 0, originCol: 6 },
    { originRow: 6, originCol: 6 },
    { originRow: 6, originCol: 0 },
    { originRow: 6, originCol: 12 },
    { originRow: 12, originCol: 6 },
  ],
};

function buildCrossHouses(boardLayout: BoardLayout): House[] {
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

export const cross: Variant = {
  id: 'cross',
  name: 'Cross Sudoku',
  description:
    'Five overlapping 9×9 grids arranged in a cross, sharing boxes where the arms meet the center.',
  help: [
    {
      label: 'Basic Rules',
      tone: 'basic',
      rules: [
        {
          term: 'Five grids',
          text: 'A center grid sits in the middle with four more extending outward in a cross pattern.',
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
          term: 'Shared boxes',
          text: 'Where an arm grid meets the center, those 3×3 boxes belong to both grids and must satisfy both sets of rules.',
        },
        {
          term: 'Solve as one',
          text: 'The five grids are linked through their shared boxes, so all of them must be solved at the same time.',
        },
      ],
    },
  ],
  popularity: 14,
  difficulty: 'advanced',
  difficultyRank: 8,
  tags: ['multidoku'],
  layout,
  symbols: [1, 2, 3, 4, 5, 6, 7, 8, 9],
  symbolKind: 'digit',
  constraintIds: ['uniqueness'],
  overlayIds: [],
  annotatorIds: ['overlap'],
  buildHouses: buildCrossHouses,
};
