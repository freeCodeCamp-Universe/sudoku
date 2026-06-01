import { describe, expect, it } from 'vitest';
import { buildModel } from '@/engine/buildModel';
import { cellId } from '@/engine/grid';
import type { AnnotatorContext, CellState } from '@/game/gameTypes';
import type { VariantModel } from '@/engine/types';
import { getVariant } from '@/variants/registry';
import { evenCellAnnotator, oddCellAnnotator } from './evenOdd';

const model: VariantModel = {
  ...buildModel(getVariant('classic')),
  structure: {
    parityMap: new Map([
      [cellId(0, 0), 0 as 0 | 1],
      [cellId(0, 1), 1 as 0 | 1],
    ]),
  },
};

const ctx: AnnotatorContext = {
  values: new Map(),
  model,
  cellState: (_id: string): CellState => ({
    candidates: [],
    given: false,
    selected: false,
    conflict: false,
  }),
};

describe('evenCellAnnotator', () => {
  it('should return "even cell" for an even-parity cell', () => {
    expect(evenCellAnnotator.describe(cellId(0, 0), ctx)).toBe('even cell');
  });

  it('should return null for a cell not in the parityMap', () => {
    expect(evenCellAnnotator.describe(cellId(1, 1), ctx)).toBeNull();
  });

  it('should return null for an odd-parity cell', () => {
    expect(evenCellAnnotator.describe(cellId(0, 1), ctx)).toBeNull();
  });
});

describe('oddCellAnnotator', () => {
  it('should return "odd cell" for an odd-parity cell', () => {
    expect(oddCellAnnotator.describe(cellId(0, 1), ctx)).toBe('odd cell');
  });

  it('should return null for an even-parity cell', () => {
    expect(oddCellAnnotator.describe(cellId(0, 0), ctx)).toBeNull();
  });
});
