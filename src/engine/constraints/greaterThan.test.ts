import { describe, expect, it } from 'vitest';
import { cellId, gridCells, standardHouses } from '../grid';
import type { Values, VariantModel } from '../types';
import { greaterThan } from './greaterThan';
import type { Relation } from './greaterThan';
import { validate } from '@/engine/validate';
import { findFixture, withFixtureStructure as withStructure } from '@/board/makeFixture';
import { greaterThanVariant } from '@/variants/greaterThan';

function makeModel(relations: Relation[]): VariantModel {
  return {
    cells: gridCells(9),
    houses: standardHouses(9, { rows: 3, cols: 3 }),
    constraints: [],
    symbols: [1, 2, 3, 4, 5, 6, 7, 8, 9],
    structure: { relations },
  };
}

describe('greaterThan constraint', () => {
  it('should report a conflict when the lesser cell holds a value >= the greater cell', () => {
    const relations: Relation[] = [{ greater: cellId(0, 0), lesser: cellId(0, 1) }];
    const values: Values = new Map([
      [cellId(0, 0), 3],
      [cellId(0, 1), 5],
    ]);

    const conflicts = greaterThan.conflicts(values, makeModel(relations));

    expect(conflicts.some((conflict) => conflict.cells.includes(cellId(0, 0)))).toBe(true);
    expect(conflicts.some((conflict) => conflict.cells.includes(cellId(0, 1)))).toBe(true);
  });

  describe('greaterThan', () => {
    it('should report no greater-than conflict on the solution', () => {
      const fixture = findFixture(greaterThanVariant, (structure) =>
        Boolean((structure as { relations?: Relation[] } | undefined)?.relations?.length)
      );
      expect(
        validate(fixture.solution, withStructure(fixture)).some(
          (c) => c.constraintId === 'greaterThan'
        )
      ).toBe(false);
    });

    it('should flag an adjacent pair whose inequality is inverted', () => {
      const fixture = findFixture(greaterThanVariant, (structure) =>
        Boolean((structure as { relations?: Relation[] } | undefined)?.relations?.length)
      );
      const relations =
        (fixture.structure as { relations?: Relation[] } | undefined)?.relations ?? [];
      const relation = relations[0];
      if (!relation) throw new Error('no greater-than relation in greaterThan fixture');

      const bad: Values = new Map(fixture.solution);
      bad.set(relation.greater, fixture.solution.get(relation.lesser) ?? 1);

      expect(
        validate(bad, withStructure(fixture)).some((c) => c.constraintId === 'greaterThan')
      ).toBe(true);
    });
  });

  it('should report no conflict when the greater cell truly holds a larger value', () => {
    const relations: Relation[] = [{ greater: cellId(0, 0), lesser: cellId(0, 1) }];
    const values: Values = new Map([
      [cellId(0, 0), 7],
      [cellId(0, 1), 2],
    ]);

    expect(greaterThan.conflicts(values, makeModel(relations))).toEqual([]);
  });

  it('should report no conflict when either cell is empty', () => {
    const relations: Relation[] = [{ greater: cellId(0, 0), lesser: cellId(0, 1) }];
    const values: Values = new Map([[cellId(0, 0), 3]]);

    expect(greaterThan.conflicts(values, makeModel(relations))).toEqual([]);
  });

  it('should be a no-op when structure has no relations', () => {
    const model: VariantModel = {
      cells: gridCells(9),
      houses: [],
      constraints: [],
      symbols: [1, 2, 3, 4, 5, 6, 7, 8, 9],
    };
    const values: Values = new Map([[cellId(0, 0), 5]]);

    expect(greaterThan.conflicts(values, model)).toEqual([]);
  });

  it('should not permit a value in the lesser cell that is >= the greater cell value', () => {
    const relations: Relation[] = [{ greater: cellId(0, 0), lesser: cellId(0, 1) }];
    const model = makeModel(relations);
    const values: Values = new Map([[cellId(0, 0), 4]]);

    expect(greaterThan.permits?.(values, cellId(0, 1), 3, model)).toBe(true);
    expect(greaterThan.permits?.(values, cellId(0, 1), 4, model)).toBe(false);
    expect(greaterThan.permits?.(values, cellId(0, 1), 6, model)).toBe(false);
  });

  it('should not permit a value in the greater cell that is <= the lesser cell value', () => {
    const relations: Relation[] = [{ greater: cellId(0, 0), lesser: cellId(0, 1) }];
    const model = makeModel(relations);
    const values: Values = new Map([[cellId(0, 1), 5]]);

    expect(greaterThan.permits?.(values, cellId(0, 0), 6, model)).toBe(true);
    expect(greaterThan.permits?.(values, cellId(0, 0), 5, model)).toBe(false);
    expect(greaterThan.permits?.(values, cellId(0, 0), 3, model)).toBe(false);
  });
});
