import { describe, expect, it } from 'vitest';
import { cellId, gridCells, range, standardHouses } from './grid';

describe('grid helpers', () => {
  it('should format cell ids canonically', () => {
    expect(cellId(2, 3)).toBe('r2c3');
  });

  it('should produce a 0..n-1 range', () => {
    expect(range(4)).toEqual([0, 1, 2, 3]);
  });

  it('should build size*size cells for a 9x9 grid', () => {
    const cells = gridCells(9);
    expect(cells).toHaveLength(81);
    expect(cells[0]).toEqual({ id: 'r0c0', row: 0, col: 0 });
  });
});

describe('standardHouses for 9x9', () => {
  const houses = standardHouses(9, { rows: 3, cols: 3 });

  it('should produce 27 houses (9 rows, 9 cols, 9 boxes)', () => {
    expect(houses).toHaveLength(27);
  });

  it('should give every house exactly 9 cells', () => {
    expect(houses.every((house) => house.cells.length === 9)).toBe(true);
  });

  it('should place the top-left box cells correctly', () => {
    const box = houses.find((house) => house.id === 'box-0-0');
    expect(box?.cells).toEqual([
      'r0c0',
      'r0c1',
      'r0c2',
      'r1c0',
      'r1c1',
      'r1c2',
      'r2c0',
      'r2c1',
      'r2c2',
    ]);
  });
});
