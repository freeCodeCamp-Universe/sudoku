import { describe, expect, it } from 'vitest';
import { cellId, gridCells, standardHouses } from '@/engine/grid';
import type { Values, VariantModel } from '@/engine/types';
import type { AnnotatorContext, CellState } from '@/game/gameTypes';
import type { Chain as ChainType } from '@/engine/constraints/chain';
import { chainAnnotator } from './chain';

function makeCtx(chains: ChainType[], values: Values = new Map()): AnnotatorContext {
  const model: VariantModel = {
    cells: gridCells(9),
    houses: standardHouses(9, { rows: 3, cols: 3 }),
    constraints: [],
    symbols: [1, 2, 3, 4, 5, 6, 7, 8, 9],
    structure: { chains },
  };

  return {
    values,
    model,
    cellState: (_id: string): CellState => ({
      candidates: [],
      given: false,
      selected: false,
      conflict: false,
    }),
  };
}

describe('chainAnnotator', () => {
  it('should describe a cell that is part of a single chain', () => {
    const chains: ChainType[] = [
      { cells: [cellId(0, 1), cellId(1, 1), cellId(1, 2)], color: '#99c9ff' },
    ];
    const result = chainAnnotator.describe(cellId(0, 1), makeCtx(chains));

    expect(result).toBe('chain of 3 cells');
  });

  it('should describe cells when multiple chains exist', () => {
    const chains: ChainType[] = [
      { cells: [cellId(0, 1), cellId(1, 1), cellId(1, 2)], color: '#99c9ff' },
      { cells: [cellId(5, 5), cellId(5, 6)], color: '#ffc999' },
    ];

    expect(chainAnnotator.describe(cellId(0, 1), makeCtx(chains))).toBe('chain 1 of 2, 3 cells');
    expect(chainAnnotator.describe(cellId(5, 5), makeCtx(chains))).toBe('chain 2 of 2, 2 cells');
  });

  it('should return null for a cell not in any chain', () => {
    const chains: ChainType[] = [
      { cells: [cellId(0, 1), cellId(1, 1)], color: '#99c9ff' },
    ];

    expect(chainAnnotator.describe(cellId(5, 5), makeCtx(chains))).toBeNull();
  });
});
