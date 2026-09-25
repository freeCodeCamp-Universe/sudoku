import { describe, expect, it } from 'vitest';
import { cellId, gridCells, standardHouses } from '../grid';
import type { Values, VariantModel } from '../types';
import { chain } from './chain';
import type { Chain as ChainType } from './chain';
import type { CellId } from '../types';
import { validate } from '@/engine/validate';
import { findFixture, withFixtureStructure as withStructure } from '@/board/makeFixture';
import { chainVariant } from '@/variants/chain';

function makeModel(chains: ChainType[]): VariantModel {
  return {
    cells: gridCells(9),
    houses: standardHouses(9, { rows: 3, cols: 3 }),
    constraints: [],
    symbols: [1, 2, 3, 4, 5, 6, 7, 8, 9],
    structure: { chains },
  };
}

describe('chain constraint', () => {
  it('should report a conflict when a chain has a duplicate value', () => {
    const chains: ChainType[] = [{ cells: [cellId(0, 0), cellId(0, 1), cellId(0, 2)] }];
    const values: Values = new Map([
      [cellId(0, 0), 4],
      [cellId(0, 1), 4],
      [cellId(0, 2), 5],
    ]);

    const conflicts = chain.conflicts(values, makeModel(chains));

    expect(conflicts.some((conflict) => conflict.cells.includes(cellId(0, 0)))).toBe(true);
    expect(conflicts.some((conflict) => conflict.cells.includes(cellId(0, 1)))).toBe(true);
  });

  describe('chain', () => {
    it('should report no chain conflict on the solution', () => {
      const fixture = findFixture(chainVariant, (structure) =>
        Boolean((structure as { chains?: ChainType[] } | undefined)?.chains?.length)
      );
      expect(
        validate(fixture.solution, withStructure(fixture)).some((c) => c.constraintId === 'chain')
      ).toBe(false);
    });

    it('should flag a chain whose values are no longer consecutive or unique', () => {
      const fixture = findFixture(chainVariant, (structure) =>
        Boolean((structure as { chains?: ChainType[] } | undefined)?.chains?.length)
      );
      const chains = (fixture.structure as { chains?: ChainType[] } | undefined)?.chains ?? [];
      const chain = chains[0];
      if (!chain) throw new Error('no chain in chain fixture');

      const bad: Values = new Map(fixture.solution);
      bad.set(chain.cells[0] as CellId, 5);
      bad.set(chain.cells[1] as CellId, 5);

      expect(validate(bad, withStructure(fixture)).some((c) => c.constraintId === 'chain')).toBe(
        true
      );
    });
  });

  it('should report a conflict when the range of filled chain values >= chain length', () => {
    const chains: ChainType[] = [{ cells: [cellId(0, 0), cellId(0, 1), cellId(0, 2)] }];
    const values: Values = new Map([
      [cellId(0, 0), 1],
      [cellId(0, 1), 8],
    ]);

    const conflicts = chain.conflicts(values, makeModel(chains));

    expect(conflicts.some((conflict) => conflict.cells.includes(cellId(0, 0)))).toBe(true);
  });

  it('should report no conflict for a valid partial chain fill', () => {
    const chains: ChainType[] = [
      { cells: [cellId(0, 0), cellId(0, 1), cellId(0, 2), cellId(0, 3)] },
    ];
    const values: Values = new Map([
      [cellId(0, 0), 3],
      [cellId(0, 1), 4],
    ]);

    expect(chain.conflicts(values, makeModel(chains))).toEqual([]);
  });

  it('should report no conflict for a fully valid chain', () => {
    const chains: ChainType[] = [{ cells: [cellId(0, 0), cellId(0, 1), cellId(0, 2)] }];
    const values: Values = new Map([
      [cellId(0, 0), 4],
      [cellId(0, 1), 6],
      [cellId(0, 2), 5],
    ]);

    expect(chain.conflicts(values, makeModel(chains))).toEqual([]);
  });

  it('should be a no-op when structure has no chains', () => {
    const model: VariantModel = {
      cells: gridCells(9),
      houses: [],
      constraints: [],
      symbols: [1, 2, 3, 4, 5, 6, 7, 8, 9],
    };
    const values: Values = new Map([[cellId(0, 0), 5]]);

    expect(chain.conflicts(values, model)).toEqual([]);
  });

  it('should not permit a value that would create a duplicate in the chain', () => {
    const chains: ChainType[] = [{ cells: [cellId(0, 0), cellId(0, 1), cellId(0, 2)] }];
    const model = makeModel(chains);
    const values: Values = new Map([[cellId(0, 0), 5]]);

    expect(chain.permits?.(values, cellId(0, 1), 5, model)).toBe(false);
    expect(chain.permits?.(values, cellId(0, 1), 6, model)).toBe(true);
  });

  it('should not permit a value that would push the range beyond chain length - 1', () => {
    const chains: ChainType[] = [{ cells: [cellId(0, 0), cellId(0, 1), cellId(0, 2)] }];
    const model = makeModel(chains);
    const values: Values = new Map([[cellId(0, 0), 1]]);

    expect(chain.permits?.(values, cellId(0, 1), 5, model)).toBe(false);
    expect(chain.permits?.(values, cellId(0, 1), 2, model)).toBe(true);
    expect(chain.permits?.(values, cellId(0, 1), 3, model)).toBe(true);
  });
});
