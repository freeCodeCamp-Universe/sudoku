import { describe, expect, it } from 'vitest';
import { gridCells, standardHouses } from '../grid';
import type { VariantModel, Values } from '../types';
import { cageSum } from './cageSum';
import type { Cage } from '@/game/gameTypes';

function makeModel(cages: Cage[]): VariantModel {
  return {
    cells: gridCells(9),
    houses: standardHouses(9, { rows: 3, cols: 3 }),
    constraints: [],
    symbols: [1, 2, 3, 4, 5, 6, 7, 8, 9],
    structure: { cages },
  };
}

describe('cageSum constraint', () => {
  it('should report a conflict when the cage sum is wrong (all cells filled)', () => {
    const cages: Cage[] = [{ cells: ['r0c0', 'r0c1'], sum: 10 }];
    const values: Values = new Map([
      ['r0c0', 3],
      ['r0c1', 4],
    ]);
    const conflicts = cageSum.conflicts(values, makeModel(cages));

    expect(conflicts.some((conflict) => conflict.constraintId === 'cageSum')).toBe(true);
    expect(conflicts[0]?.cells).toEqual(expect.arrayContaining(['r0c0', 'r0c1']));
  });

  it('should report no conflict when cage sum is correct', () => {
    const cages: Cage[] = [{ cells: ['r0c0', 'r0c1'], sum: 7 }];
    const values: Values = new Map([
      ['r0c0', 3],
      ['r0c1', 4],
    ]);

    expect(cageSum.conflicts(values, makeModel(cages))).toEqual([]);
  });

  it('should not check sum when cage is only partially filled', () => {
    const cages: Cage[] = [{ cells: ['r0c0', 'r0c1', 'r0c2'], sum: 6 }];
    const values: Values = new Map([['r0c0', 1]]);

    expect(cageSum.conflicts(values, makeModel(cages))).toEqual([]);
  });

  it('should report a conflict when a cage contains duplicate values', () => {
    const cages: Cage[] = [{ cells: ['r0c0', 'r0c1'], sum: 10 }];
    const values: Values = new Map([
      ['r0c0', 5],
      ['r0c1', 5],
    ]);
    const conflicts = cageSum.conflicts(values, makeModel(cages));

    expect(conflicts.some((conflict) => conflict.constraintId === 'cageSum')).toBe(true);
  });

  it('should be a no-op when structure is absent', () => {
    const model: VariantModel = {
      cells: gridCells(9),
      houses: [],
      constraints: [],
      symbols: [1, 2, 3, 4, 5, 6, 7, 8, 9],
    };
    const values: Values = new Map([['r0c0', 3]]);

    expect(cageSum.conflicts(values, model)).toEqual([]);
  });

  it('should not permit a value that duplicates an existing cage member', () => {
    const cages: Cage[] = [{ cells: ['r0c0', 'r0c1', 'r0c2'], sum: 15 }];
    const model = makeModel(cages);
    const values: Values = new Map([['r0c0', 4]]);

    expect(cageSum.permits?.(values, 'r0c1', 4, model)).toBe(false);
    expect(cageSum.permits?.(values, 'r0c1', 5, model)).toBe(true);
  });
});
