import { describe, expect, it } from 'vitest';
import { gridCells, standardHouses } from '../grid';
import type { VariantModel, Values } from '../types';
import { arrowSum } from './arrowSum';
import type { Arrow } from '@/game/gameTypes';

function makeModel(arrows: Arrow[]): VariantModel {
  return {
    cells: gridCells(9),
    houses: standardHouses(9, { rows: 3, cols: 3 }),
    constraints: [],
    symbols: [1, 2, 3, 4, 5, 6, 7, 8, 9],
    structure: { arrows },
  };
}

describe('arrowSum constraint', () => {
  it('should report a conflict when path sum does not equal bulb value', () => {
    const arrows: Arrow[] = [{ bulb: 'r0c0', path: ['r0c1', 'r0c2'] }];
    const values: Values = new Map([
      ['r0c0', 5],
      ['r0c1', 2],
      ['r0c2', 4],
    ]);
    const conflicts = arrowSum.conflicts(values, makeModel(arrows));

    expect(conflicts.some((conflict) => conflict.constraintId === 'arrowSum')).toBe(true);
    expect(conflicts[0]?.cells).toEqual(expect.arrayContaining(['r0c0', 'r0c1', 'r0c2']));
  });

  it('should report no conflict when path sum equals bulb value', () => {
    const arrows: Arrow[] = [{ bulb: 'r0c0', path: ['r0c1', 'r0c2'] }];
    const values: Values = new Map([
      ['r0c0', 6],
      ['r0c1', 2],
      ['r0c2', 4],
    ]);

    expect(arrowSum.conflicts(values, makeModel(arrows))).toEqual([]);
  });

  it('should not check when any arrow cell is empty', () => {
    const arrows: Arrow[] = [{ bulb: 'r0c0', path: ['r0c1', 'r0c2'] }];
    const values: Values = new Map([
      ['r0c0', 6],
      ['r0c1', 2],
    ]);

    expect(arrowSum.conflicts(values, makeModel(arrows))).toEqual([]);
  });

  it('should be a no-op when structure is absent', () => {
    const model: VariantModel = {
      cells: gridCells(9),
      houses: [],
      constraints: [],
      symbols: [1, 2, 3, 4, 5, 6, 7, 8, 9],
    };

    expect(arrowSum.conflicts(new Map([['r0c0', 5]]), model)).toEqual([]);
  });

  it('should not permit a path value that would already exceed the bulb', () => {
    const arrows: Arrow[] = [{ bulb: 'r0c0', path: ['r0c1', 'r0c2'] }];
    const model = makeModel(arrows);
    const values: Values = new Map([
      ['r0c0', 5],
      ['r0c1', 4],
    ]);

    expect(arrowSum.permits?.(values, 'r0c2', 3, model)).toBe(false);
    expect(arrowSum.permits?.(values, 'r0c2', 1, model)).toBe(true);
  });
});
