import { describe, expect, it } from 'vitest';
import { cellId, gridCells, standardHouses } from '../grid';
import type { Values, VariantModel } from '../types';
import { consecutive } from './consecutive';
import type { Mark } from './consecutive';

function makeModel(marks: Mark[]): VariantModel {
  return {
    cells: gridCells(9),
    houses: standardHouses(9, { rows: 3, cols: 3 }),
    constraints: [],
    symbols: [1, 2, 3, 4, 5, 6, 7, 8, 9],
    structure: { marks },
  };
}

describe('consecutive constraint', () => {
  it('should report a conflict when a marked pair does not differ by 1', () => {
    const marks: Mark[] = [{ a: cellId(0, 0), b: cellId(0, 1) }];
    const values: Values = new Map([
      [cellId(0, 0), 3],
      [cellId(0, 1), 5],
    ]);

    const conflicts = consecutive.conflicts(values, makeModel(marks));

    expect(conflicts.some((conflict) => conflict.cells.includes(cellId(0, 0)))).toBe(true);
  });

  it('should report no conflict when a marked pair differs by exactly 1', () => {
    const marks: Mark[] = [{ a: cellId(0, 0), b: cellId(0, 1) }];
    const values: Values = new Map([
      [cellId(0, 0), 4],
      [cellId(0, 1), 5],
    ]);

    expect(consecutive.conflicts(values, makeModel(marks))).toEqual([]);
  });

  it('should report a conflict when an unmarked adjacent pair is consecutive', () => {
    const values: Values = new Map([
      [cellId(0, 0), 4],
      [cellId(0, 1), 5],
    ]);

    const conflicts = consecutive.conflicts(values, makeModel([]));

    expect(conflicts.some((conflict) => conflict.cells.includes(cellId(0, 0)))).toBe(true);
  });

  it('should report no conflict when an unmarked adjacent pair is not consecutive', () => {
    const values: Values = new Map([
      [cellId(0, 0), 4],
      [cellId(0, 1), 6],
    ]);

    expect(consecutive.conflicts(values, makeModel([]))).toEqual([]);
  });

  it('should report no conflict when either cell in a pair is empty', () => {
    const marks: Mark[] = [{ a: cellId(0, 0), b: cellId(0, 1) }];
    const values: Values = new Map([[cellId(0, 0), 3]]);

    expect(consecutive.conflicts(values, makeModel(marks))).toEqual([]);
  });

  it('should be a no-op when structure is absent', () => {
    const model: VariantModel = {
      cells: gridCells(9),
      houses: [],
      constraints: [],
      symbols: [1, 2, 3, 4, 5, 6, 7, 8, 9],
    };
    const values: Values = new Map([
      [cellId(0, 0), 4],
      [cellId(0, 1), 5],
    ]);

    expect(consecutive.conflicts(values, model)).toEqual([]);
  });

  it('should not permit a marked-consecutive value that does not differ by 1 from the known peer', () => {
    const marks: Mark[] = [{ a: cellId(0, 0), b: cellId(0, 1) }];
    const model = makeModel(marks);
    const values: Values = new Map([[cellId(0, 0), 4]]);

    expect(consecutive.permits?.(values, cellId(0, 1), 3, model)).toBe(true);
    expect(consecutive.permits?.(values, cellId(0, 1), 5, model)).toBe(true);
    expect(consecutive.permits?.(values, cellId(0, 1), 6, model)).toBe(false);
  });

  it('should not permit an unmarked-adjacent value that is consecutive with the known peer', () => {
    const model = makeModel([]);
    const values: Values = new Map([[cellId(0, 0), 4]]);

    expect(consecutive.permits?.(values, cellId(0, 1), 3, model)).toBe(false);
    expect(consecutive.permits?.(values, cellId(0, 1), 5, model)).toBe(false);
    expect(consecutive.permits?.(values, cellId(0, 1), 6, model)).toBe(true);
  });
});
