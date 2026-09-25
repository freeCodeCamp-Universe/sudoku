import { describe, expect, it } from 'vitest';
import { cellId, gridCells, range, standardHouses } from '../grid';
import type { Values, VariantModel } from '../types';
import { sandwichSum } from './sandwichSum';
import type { CellId } from '../types';
import { validate } from '@/engine/validate';
import { findFixture, withFixtureStructure as withStructure } from '@/board/makeFixture';
import { sandwich } from '@/variants/sandwich';

function makeModel(rows: number[], cols: number[] = Array(9).fill(0)): VariantModel {
  return {
    cells: gridCells(9),
    houses: standardHouses(9, { rows: 3, cols: 3 }),
    constraints: [],
    symbols: [1, 2, 3, 4, 5, 6, 7, 8, 9],
    structure: { rows, cols },
  };
}

describe('sandwichSum constraint', () => {
  it('should allow a complete row whose between-sum matches its clue', () => {
    const values: Values = new Map([
      [cellId(0, 0), 1],
      [cellId(0, 1), 5],
      [cellId(0, 2), 9],
      [cellId(0, 3), 2],
      [cellId(0, 4), 3],
      [cellId(0, 5), 4],
      [cellId(0, 6), 6],
      [cellId(0, 7), 7],
      [cellId(0, 8), 8],
    ]);

    expect(sandwichSum.conflicts(values, makeModel([5, 0, 0, 0, 0, 0, 0, 0, 0]))).toEqual([]);
  });

  describe('sandwichSum', () => {
    it('should report no sandwich-sum conflict on the solution', () => {
      const fixture = findFixture(
        sandwich,
        (structure) =>
          Boolean(
            (structure as { rows?: number[]; cols?: number[] } | undefined)?.rows?.some(
              (value) => value > 0
            )
          ) ||
          Boolean(
            (structure as { rows?: number[]; cols?: number[] } | undefined)?.cols?.some(
              (value) => value > 0
            )
          )
      );
      expect(
        validate(fixture.solution, withStructure(fixture)).some(
          (c) => c.constraintId === 'sandwichSum'
        )
      ).toBe(false);
    });

    it('should flag a row or column whose between-sum no longer matches its clue', () => {
      const fixture = findFixture(
        sandwich,
        (structure) =>
          Boolean(
            (structure as { rows?: number[]; cols?: number[] } | undefined)?.rows?.some(
              (value) => value > 0
            )
          ) ||
          Boolean(
            (structure as { rows?: number[]; cols?: number[] } | undefined)?.cols?.some(
              (value) => value > 0
            )
          )
      );
      const structure = fixture.structure as { rows?: number[]; cols?: number[] } | undefined;
      const rowIndex = structure?.rows?.findIndex((value) => value > 0) ?? -1;
      if (rowIndex < 0) throw new Error('no sandwich row clue in sandwich fixture');

      const rowCells = range(9).map((col) => cellId(rowIndex, col) as CellId);
      const currentValues = rowCells.map((cellId) => fixture.solution.get(cellId) ?? 0);
      const firstOne = currentValues.indexOf(1);
      const lastNine = currentValues.lastIndexOf(9);
      if (firstOne === -1 || lastNine === -1 || lastNine <= firstOne + 1) {
        throw new Error('no sandwich between-sum cells in sandwich fixture');
      }

      const targetIndex = firstOne + 1;
      const currentValue = currentValues[targetIndex] ?? 0;
      const replacement = currentValue < 9 ? currentValue + 1 : currentValue - 1;
      const targetCell = rowCells[targetIndex] as CellId;
      const bad: Values = new Map(fixture.solution);
      bad.set(targetCell, replacement);

      expect(
        validate(bad, withStructure(fixture)).some((c) => c.constraintId === 'sandwichSum')
      ).toBe(true);
    });
  });

  it('should report a conflict for a complete row whose between-sum does not match its clue', () => {
    const values: Values = new Map([
      [cellId(0, 0), 1],
      [cellId(0, 1), 5],
      [cellId(0, 2), 9],
      [cellId(0, 3), 2],
      [cellId(0, 4), 3],
      [cellId(0, 5), 4],
      [cellId(0, 6), 6],
      [cellId(0, 7), 7],
      [cellId(0, 8), 8],
    ]);

    const conflicts = sandwichSum.conflicts(values, makeModel([6, 0, 0, 0, 0, 0, 0, 0, 0]));

    expect(conflicts.some((conflict) => conflict.constraintId === 'sandwichSum')).toBe(true);
  });

  it('should report a conflict for a complete column whose between-sum does not match its clue', () => {
    const values: Values = new Map([
      [cellId(0, 0), 1],
      [cellId(1, 0), 5],
      [cellId(2, 0), 9],
      [cellId(3, 0), 2],
      [cellId(4, 0), 3],
      [cellId(5, 0), 4],
      [cellId(6, 0), 6],
      [cellId(7, 0), 7],
      [cellId(8, 0), 8],
    ]);

    const conflicts = sandwichSum.conflicts(
      values,
      makeModel([0, 0, 0, 0, 0, 0, 0, 0, 0], [6, 0, 0, 0, 0, 0, 0, 0, 0])
    );

    expect(conflicts.some((conflict) => conflict.cells.includes(cellId(0, 0)))).toBe(true);
  });

  it('should skip a complete row that is missing 1 or 9', () => {
    const values: Values = new Map(range(9).map((index) => [cellId(0, index), 2 + index]));

    expect(sandwichSum.conflicts(values, makeModel([5]))).toEqual([]);
  });

  it('should skip a partially-filled row', () => {
    const values: Values = new Map([
      [cellId(0, 0), 1],
      [cellId(0, 1), 5],
      [cellId(0, 2), 9],
    ]);

    expect(sandwichSum.conflicts(values, makeModel([5]))).toEqual([]);
  });

  it('should be a no-op when structure is absent', () => {
    const model: VariantModel = {
      cells: gridCells(9),
      houses: [],
      constraints: [],
      symbols: [1, 2, 3, 4, 5, 6, 7, 8, 9],
    };
    const values: Values = new Map([
      [cellId(0, 0), 1],
      [cellId(0, 1), 5],
      [cellId(0, 2), 9],
      [cellId(0, 3), 2],
      [cellId(0, 4), 3],
      [cellId(0, 5), 4],
      [cellId(0, 6), 6],
      [cellId(0, 7), 7],
      [cellId(0, 8), 8],
    ]);

    expect(sandwichSum.conflicts(values, model)).toEqual([]);
  });

  it('should reject a candidate that makes the between-sum exceed the clue, and allow one that still fits', () => {
    const strictModel = makeModel([5, 0, 0, 0, 0, 0, 0, 0, 0]);
    const looseModel = makeModel([6, 0, 0, 0, 0, 0, 0, 0, 0]);
    const values: Values = new Map([
      [cellId(0, 0), 1],
      [cellId(0, 2), 9],
    ]);

    expect(sandwichSum.permits?.(values, cellId(0, 1), 6, strictModel)).toBe(false);
    expect(sandwichSum.permits?.(values, cellId(0, 1), 6, looseModel)).toBe(true);
  });
});
