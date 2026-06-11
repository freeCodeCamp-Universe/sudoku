import { cellId, range } from '@/engine/grid';
import type { BoardLayout, House, MultiGridLayout, Variant } from '@/engine/types';

const layout: MultiGridLayout = {
  kind: 'multigrid',
  subGridSize: 9,
  box: { rows: 3, cols: 3 },
  canvasRows: 12,
  canvasCols: 12,
  subGrids: [
    { originRow: 0, originCol: 0 },
    { originRow: 0, originCol: 3 },
    { originRow: 3, originCol: 0 },
    { originRow: 3, originCol: 3 },
  ],
};

function buildButterflyHouses(boardLayout: BoardLayout): House[] {
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

export const butterfly: Variant = {
  id: 'butterfly',
  name: 'Butterfly Sudoku',
  description: 'Four overlapping 9×9 grids sharing a central region, forming a butterfly shape on a 12×12 board.',
  help: [
    {
      label: 'Basic Rules',
      tone: 'basic',
      rules: [
        { term: 'The layout', text: 'Four 9×9 grids are placed on a 12×12 board, overlapping at the corners to create a butterfly shape.' },
        { term: 'Fill with 1–9', text: 'Every cell within each 9×9 grid must contain a digit from 1 to 9.' },
        { term: 'Standard sudoku', text: 'Within each grid, every row, column, and 3×3 box must hold each digit exactly once.' },
      ],
    },
    {
      label: 'Additional Rules',
      tone: 'extra',
      rules: [
        { term: 'Shared corners', text: 'Where two grids overlap, the shared 3×3 box must satisfy the rules of both grids at the same time.' },
        { term: 'Solve together', text: 'The four grids are linked through their overlapping corners. None can be solved in isolation.' },
      ],
    },
  ],
  popularity: 18,
  difficulty: 'advanced',
  difficultyRank: 7,
  tags: ['multidoku'],
  layout,
  symbols: [1, 2, 3, 4, 5, 6, 7, 8, 9],
  symbolKind: 'digit',
  constraintIds: ['uniqueness'],
  overlayIds: [],
  annotatorIds: ['overlap'],
  buildHouses: buildButterflyHouses,
};
