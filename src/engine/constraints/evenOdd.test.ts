import { describe, expect, it } from 'vitest';
import { cellId, gridCells, standardHouses } from '../grid';
import type { Values, VariantModel } from '../types';
import { evenOdd } from './evenOdd';

function makeModel(parityMap: Map<string, 0 | 1>): VariantModel {
  return {
    cells: gridCells(9),
    houses: standardHouses(9, { rows: 3, cols: 3 }),
    constraints: [],
    symbols: [1, 2, 3, 4, 5, 6, 7, 8, 9],
    structure: { parityMap },
  };
}

describe('evenOdd constraint', () => {
  it('should report a conflict when an even-marked cell holds an odd value', () => {
    const parityMap = new Map<string, 0 | 1>([[cellId(0, 0), 0]]);
    const values: Values = new Map([[cellId(0, 0), 3]]);
    const conflicts = evenOdd.conflicts(values, makeModel(parityMap));

    expect(conflicts.some((conflict) => conflict.cells.includes(cellId(0, 0)))).toBe(true);
  });

  it('should report a conflict when an odd-marked cell holds an even value', () => {
    const parityMap = new Map<string, 0 | 1>([[cellId(0, 0), 1]]);
    const values: Values = new Map([[cellId(0, 0), 4]]);
    const conflicts = evenOdd.conflicts(values, makeModel(parityMap));

    expect(conflicts.some((conflict) => conflict.cells.includes(cellId(0, 0)))).toBe(true);
  });

  it('should report no conflict when value parity matches cell parity', () => {
    const parityMap = new Map<string, 0 | 1>([
      [cellId(0, 0), 0],
      [cellId(0, 1), 1],
    ]);
    const values: Values = new Map([
      [cellId(0, 0), 2],
      [cellId(0, 1), 7],
    ]);

    expect(evenOdd.conflicts(values, makeModel(parityMap))).toEqual([]);
  });

  it('should return no conflicts when parityMap is absent from structure', () => {
    const model: VariantModel = {
      cells: gridCells(9),
      houses: [],
      constraints: [],
      symbols: [1, 2, 3, 4, 5, 6, 7, 8, 9],
    };
    const values: Values = new Map([[cellId(0, 0), 3]]);

    expect(evenOdd.conflicts(values, model)).toEqual([]);
  });

  it('should not permit wrong-parity placement', () => {
    const parityMap = new Map<string, 0 | 1>([[cellId(0, 0), 0]]);
    const model = makeModel(parityMap);

    expect(evenOdd.permits?.(new Map(), cellId(0, 0), 3, model)).toBe(false);
    expect(evenOdd.permits?.(new Map(), cellId(0, 0), 4, model)).toBe(true);
  });

  it('should permit any placement in a cell not in the parityMap', () => {
    const parityMap = new Map<string, 0 | 1>([[cellId(0, 0), 0]]);
    const model = makeModel(parityMap);

    expect(evenOdd.permits?.(new Map(), cellId(1, 1), 3, model)).toBe(true);
  });
});
