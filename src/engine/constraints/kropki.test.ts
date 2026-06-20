import { describe, expect, it } from 'vitest';
import { cellId, gridCells, standardHouses } from '../grid';
import type { Values, VariantModel } from '../types';
import { kropki, type KropkiMark } from './kropki';

function makeModel(marks: KropkiMark[]): VariantModel {
  return {
    cells: gridCells(9),
    houses: standardHouses(9, { rows: 3, cols: 3 }),
    constraints: [],
    symbols: [1, 2, 3, 4, 5, 6, 7, 8, 9],
    structure: { kropkiMarks: marks },
  };
}

describe('kropki constraint', () => {
  it('should allow a white-dot pair that is consecutive', () => {
    const marks: KropkiMark[] = [{ a: cellId(0, 0), b: cellId(0, 1), kind: 'white' }];
    const values: Values = new Map([
      [cellId(0, 0), 4],
      [cellId(0, 1), 5],
    ]);

    expect(kropki.conflicts(values, makeModel(marks))).toEqual([]);
  });

  it('should report a conflict for a white-dot pair that is not consecutive', () => {
    const marks: KropkiMark[] = [{ a: cellId(0, 0), b: cellId(0, 1), kind: 'white' }];
    const values: Values = new Map([
      [cellId(0, 0), 3],
      [cellId(0, 1), 7],
    ]);

    const conflicts = kropki.conflicts(values, makeModel(marks));

    expect(conflicts.some((conflict) => conflict.cells.includes(cellId(0, 0)))).toBe(true);
  });

  it('should allow a black-dot pair that is a double', () => {
    const marks: KropkiMark[] = [{ a: cellId(0, 0), b: cellId(0, 1), kind: 'black' }];
    const values: Values = new Map([
      [cellId(0, 0), 2],
      [cellId(0, 1), 4],
    ]);

    expect(kropki.conflicts(values, makeModel(marks))).toEqual([]);
  });

  it('should report a conflict for a black-dot pair that is not a double', () => {
    const marks: KropkiMark[] = [{ a: cellId(0, 0), b: cellId(0, 1), kind: 'black' }];
    const values: Values = new Map([
      [cellId(0, 0), 3],
      [cellId(0, 1), 5],
    ]);

    const conflicts = kropki.conflicts(values, makeModel(marks));

    expect(conflicts.some((conflict) => conflict.cells.includes(cellId(0, 1)))).toBe(true);
  });

  it('should report a conflict for an unmarked adjacent pair that is consecutive', () => {
    const values: Values = new Map([
      [cellId(0, 0), 4],
      [cellId(0, 1), 5],
    ]);

    const conflicts = kropki.conflicts(values, makeModel([]));

    expect(conflicts.some((conflict) => conflict.cells.includes(cellId(0, 0)))).toBe(true);
  });

  it('should report a conflict for an unmarked adjacent pair that is a double', () => {
    const values: Values = new Map([
      [cellId(0, 0), 2],
      [cellId(0, 1), 4],
    ]);

    const conflicts = kropki.conflicts(values, makeModel([]));

    expect(conflicts.some((conflict) => conflict.cells.includes(cellId(0, 1)))).toBe(true);
  });

  it('should allow an unmarked adjacent pair that is neither consecutive nor a double', () => {
    const values: Values = new Map([
      [cellId(0, 0), 3],
      [cellId(0, 1), 7],
    ]);

    expect(kropki.conflicts(values, makeModel([]))).toEqual([]);
  });

  it('should allow a marked pair when one cell is empty', () => {
    const marks: KropkiMark[] = [{ a: cellId(0, 0), b: cellId(0, 1), kind: 'white' }];
    const values: Values = new Map([[cellId(0, 0), 4]]);

    expect(kropki.conflicts(values, makeModel(marks))).toEqual([]);
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

    expect(kropki.conflicts(values, model)).toEqual([]);
  });

  it('should permit or reject candidate values around known peers for black, white, and plain dots', () => {
    const blackModel = makeModel([{ a: cellId(0, 0), b: cellId(0, 1), kind: 'black' }]);
    const whiteModel = makeModel([{ a: cellId(0, 0), b: cellId(0, 1), kind: 'white' }]);
    const plainModel = makeModel([]);
    const values: Values = new Map([[cellId(0, 0), 2]]);

    expect(kropki.permits?.(values, cellId(0, 1), 4, blackModel)).toBe(true);
    expect(kropki.permits?.(values, cellId(0, 1), 3, blackModel)).toBe(false);

    const whiteValues: Values = new Map([[cellId(0, 0), 4]]);
    expect(kropki.permits?.(whiteValues, cellId(0, 1), 5, whiteModel)).toBe(true);
    expect(kropki.permits?.(whiteValues, cellId(0, 1), 6, whiteModel)).toBe(false);

    const plainValues: Values = new Map([[cellId(0, 0), 4]]);
    expect(kropki.permits?.(plainValues, cellId(0, 1), 5, plainModel)).toBe(false);
    expect(kropki.permits?.(plainValues, cellId(0, 1), 6, plainModel)).toBe(true);
  });
});
