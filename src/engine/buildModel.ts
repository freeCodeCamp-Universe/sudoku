import { resolveConstraints } from './constraints/registry';
import { cellId, gridCells, range, standardHouses } from './grid';
import type { BoardLayout, Cell, CellId, House, Variant, VariantModel } from './types';

function buildCells(layout: BoardLayout): Cell[] {
  switch (layout.kind) {
    case 'grid':
      return gridCells(layout.size);
    case 'multigrid': {
      const { canvasRows, canvasCols, subGridSize, subGrids } = layout;
      const seen = new Set<CellId>();
      const cells: Cell[] = [];

      for (let row = 0; row < canvasRows; row += 1) {
        for (let col = 0; col < canvasCols; col += 1) {
          const gridIndex = subGrids.findIndex(
            ({ originRow, originCol }) =>
              row >= originRow &&
              row < originRow + subGridSize &&
              col >= originCol &&
              col < originCol + subGridSize
          );

          if (gridIndex === -1) {
            continue;
          }

          const id = cellId(row, col);

          if (seen.has(id)) {
            continue;
          }

          seen.add(id);
          cells.push({ id, row, col, grid: gridIndex });
        }
      }

      return cells;
    }
    case 'triangular': {
      const cells: Cell[] = [];

      for (let row = 0; row < layout.size; row += 1) {
        for (let col = 0; col <= row; col += 1) {
          cells.push({ id: cellId(row, col), row, col });
        }
      }

      return cells;
    }
    default:
      throw new Error(`Unsupported layout kind: ${(layout as { kind: string }).kind}`);
  }
}

function defaultHouses(layout: BoardLayout): House[] {
  switch (layout.kind) {
    case 'grid':
      return standardHouses(layout.size, layout.box);
    case 'multigrid': {
      const { subGridSize, box, subGrids } = layout;
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
            const cells: CellId[] = [];

            for (let row = 0; row < box.rows; row += 1) {
              for (let col = 0; col < box.cols; col += 1) {
                cells.push(
                  cellId(
                    originRow + boxRow * box.rows + row,
                    originCol + boxCol * box.cols + col
                  )
                );
              }
            }

            houses.push({ id: `g${gridIndex}-box-${boxRow}-${boxCol}`, cells });
          }
        }
      }

      return houses;
    }
    case 'triangular': {
      const houses: House[] = [];

      for (let row = 0; row < layout.size; row += 1) {
        houses.push({
          id: `tri-row-${row}`,
          cells: range(row + 1).map((col) => cellId(row, col)),
        });
      }

      for (let col = 0; col < layout.size; col += 1) {
        houses.push({
          id: `tri-col-${col}`,
          cells: range(layout.size - col).map((offset) => cellId(col + offset, col)),
        });
      }

      return houses;
    }
    default:
      throw new Error(`Unsupported layout kind: ${(layout as { kind: string }).kind}`);
  }
}

export function buildModel(variant: Variant): VariantModel {
  const { layout } = variant;
  const cells = buildCells(layout);
  const houses = [
    ...(variant.buildHouses?.(layout) ?? defaultHouses(layout)),
    ...(variant.extraHouses?.(layout) ?? []),
  ];

  return {
    cells,
    houses,
    constraints: resolveConstraints(variant.constraintIds),
    symbols: variant.symbols,
    generateSolution: variant.generateSolution,
    minimumClues: variant.minimumClues,
  };
}
