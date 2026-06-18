import { cellId, range } from '@/engine/grid';
import type { BoardLayout, House, MultiGridLayout, Variant } from '@/engine/types';

const layout: MultiGridLayout = {
  kind: 'multigrid',
  subGridSize: 9,
  box: { rows: 3, cols: 3 },
  canvasRows: 21,
  canvasCols: 21,
  subGrids: [
    { originRow: 0, originCol: 6 }, // top
    { originRow: 6, originCol: 0 }, // left
    { originRow: 6, originCol: 12 }, // right
    { originRow: 12, originCol: 6 }, // bottom
  ],
};

function buildSoheiHouses(boardLayout: BoardLayout): House[] {
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

export const sohei: Variant = {
  id: 'sohei',
  name: 'Sohei Sudoku',
  description:
    'Four 9×9 grids form a diamond ring, each sharing one 3×3 corner box with its two neighboring grids.',
  help: [
    {
      label: 'Basic Rules',
      tone: 'basic',
      rules: [
        {
          term: 'Four grids',
          text: 'Four 9×9 grids are placed in a diamond pattern, with each arm touching its two neighbors at a corner.',
        },
        {
          term: 'Fill with 1–9',
          text: 'Every cell in each 9×9 grid must contain a digit from 1 to 9.',
        },
        {
          term: 'Standard sudoku',
          text: 'Within each grid, every row, column, and 3×3 box must hold each digit exactly once.',
        },
      ],
    },
    {
      label: 'Additional Rules',
      tone: 'extra',
      rules: [
        {
          term: 'Shared corners',
          text: 'Each pair of neighboring grids shares exactly one 3×3 box, which must satisfy the rules of both grids simultaneously.',
        },
        {
          term: 'Solve as one',
          text: 'The four shared corners link all grids into one puzzle; none can be solved without the others.',
        },
      ],
    },
  ],
  popularity: 10,
  difficulty: 'advanced',
  difficultyRank: 6,
  tags: ['multidoku'],
  layout,
  symbols: [1, 2, 3, 4, 5, 6, 7, 8, 9],
  symbolKind: 'digit',
  constraintIds: ['uniqueness'],
  overlayIds: [],
  annotatorIds: ['overlap'],
  buildHouses: buildSoheiHouses,
};
