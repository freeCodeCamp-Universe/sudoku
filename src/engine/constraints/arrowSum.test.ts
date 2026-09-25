import { describe, expect, it } from 'vitest';
import { gridCells, standardHouses } from '../grid';
import type { VariantModel, Values } from '../types';
import { arrowSum } from './arrowSum';
import type { Arrow } from '@/engine/types';
import type { CellId } from '@/engine/types';
import { validate } from '@/engine/validate';
import { findFixture, withFixtureStructure as withStructure } from '@/board/makeFixture';
import { arrow } from '@/variants/arrow';

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

  describe('arrowSum', () => {
    it('should report no arrow-sum conflict on the solution', () => {
      const fixture = findFixture(arrow, (structure) =>
        Boolean((structure as { arrows?: Arrow[] } | undefined)?.arrows?.length)
      );
      expect(
        validate(fixture.solution, withStructure(fixture)).some(
          (c) => c.constraintId === 'arrowSum'
        )
      ).toBe(false);
    });

    it('should flag an arrow whose path sum no longer matches its bulb', () => {
      const fixture = findFixture(arrow, (structure) =>
        Boolean((structure as { arrows?: Arrow[] } | undefined)?.arrows?.length)
      );
      const arrows = (fixture.structure as { arrows?: Arrow[] } | undefined)?.arrows ?? [];
      const arrowDef = arrows[0];
      if (!arrowDef) throw new Error('no arrow in arrow fixture');

      const bad: Values = new Map(fixture.solution);
      const target = arrowDef.path[0] as CellId;
      const currentValue = fixture.solution.get(target) ?? 0;
      const replacement = currentValue < 9 ? currentValue + 1 : currentValue - 1;
      bad.set(target, replacement);

      expect(validate(bad, withStructure(fixture)).some((c) => c.constraintId === 'arrowSum')).toBe(
        true
      );
    });
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
