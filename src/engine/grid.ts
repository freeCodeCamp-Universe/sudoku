import type { Cell, CellId, House } from './types';

export const cellId = (row: number, col: number): CellId => `r${row}c${col}`;

export const range = (n: number): number[] => Array.from({ length: n }, (_, index) => index);

export function shuffle<T>(arr: readonly T[], rng: () => number = Math.random): T[] {
  const out = [...arr];
  for (let index = out.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(rng() * (index + 1));
    [out[index], out[swapIndex]] = [out[swapIndex], out[index]];
  }
  return out;
}

export function gridCells(size: number): Cell[] {
  const cells: Cell[] = [];
  for (let row = 0; row < size; row += 1) {
    for (let col = 0; col < size; col += 1) {
      cells.push({ id: cellId(row, col), row, col });
    }
  }
  return cells;
}

export function standardHouses(size: number, box: { rows: number; cols: number }): House[] {
  if (size % box.rows !== 0 || size % box.cols !== 0) {
    throw new Error(`Invalid box size ${box.rows}x${box.cols} for grid size ${size}`);
  }

  const houses: House[] = [];

  for (let row = 0; row < size; row += 1) {
    houses.push({ id: `row-${row}`, cells: range(size).map((col) => cellId(row, col)) });
  }

  for (let col = 0; col < size; col += 1) {
    houses.push({ id: `col-${col}`, cells: range(size).map((row) => cellId(row, col)) });
  }

  for (let boxRow = 0; boxRow < size / box.rows; boxRow += 1) {
    for (let boxCol = 0; boxCol < size / box.cols; boxCol += 1) {
      const cells: CellId[] = [];
      for (let row = 0; row < box.rows; row += 1) {
        for (let col = 0; col < box.cols; col += 1) {
          cells.push(cellId(boxRow * box.rows + row, boxCol * box.cols + col));
        }
      }
      houses.push({ id: `box-${boxRow}-${boxCol}`, cells });
    }
  }

  return houses;
}
