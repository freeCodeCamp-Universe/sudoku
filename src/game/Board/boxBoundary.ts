import type { BoardProps } from '@/game/gameTypes';

export function isBoxBoundary(
  variant: BoardProps['variant'],
  cell: BoardProps['cells'][number],
  axis: 'row' | 'col'
): boolean {
  switch (variant.layout.kind) {
    case 'grid': {
      const size = variant.layout.size;
      const step = axis === 'row' ? variant.layout.box.rows : variant.layout.box.cols;
      const value = axis === 'row' ? cell.row : cell.col;

      return (value + 1) % step === 0 && value < size - 1;
    }
    case 'triangular': {
      const size = variant.layout.size;
      if (axis === 'row') {
        return (cell.row + 1) % 3 === 0 && cell.row < size - 1;
      }

      return (cell.col + 1) % 3 === 0 && cell.col < size - 1 && cell.col < cell.row;
    }
    case 'multigrid': {
      const { subGrids, subGridSize, box, canvasCols, canvasRows } = variant.layout;
      const step = axis === 'row' ? box.rows : box.cols;
      const value = axis === 'row' ? cell.row : cell.col;
      const canvasMax = axis === 'row' ? canvasRows : canvasCols;
      const isLocalBoundary = subGrids.some(({ originRow, originCol }) => {
        const inGrid =
          cell.row >= originRow &&
          cell.row < originRow + subGridSize &&
          cell.col >= originCol &&
          cell.col < originCol + subGridSize;

        if (!inGrid) {
          return false;
        }

        const local = axis === 'row' ? cell.row - originRow : cell.col - originCol;

        return (local + 1) % step === 0 && local < subGridSize - 1;
      });

      return isLocalBoundary && value < canvasMax - 1;
    }
    default:
      return false;
  }
}
