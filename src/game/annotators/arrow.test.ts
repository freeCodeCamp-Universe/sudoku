import { describe, expect, it } from 'vitest';
import { gridCells, standardHouses } from '@/engine/grid';
import type { VariantModel } from '@/engine/types';
import type { AnnotatorContext, Arrow, CellState } from '@/game/gameTypes';
import { arrowBulbAnnotator, arrowPathAnnotator } from './arrow';

const arrows: Arrow[] = [{ bulb: 'r0c0', path: ['r0c1', 'r0c2'] }];

const model: VariantModel = {
  cells: gridCells(9),
  houses: standardHouses(9, { rows: 3, cols: 3 }),
  constraints: [],
  symbols: [1, 2, 3, 4, 5, 6, 7, 8, 9],
  structure: { arrows },
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

describe('arrowBulbAnnotator', () => {
  it('should return "arrow circle" for a bulb cell', () => {
    expect(arrowBulbAnnotator.describe('r0c0', ctx)).toBe('arrow circle');
  });

  it('should return null for a path cell', () => {
    expect(arrowBulbAnnotator.describe('r0c1', ctx)).toBeNull();
  });

  it('should return null for an unrelated cell', () => {
    expect(arrowBulbAnnotator.describe('r4c4', ctx)).toBeNull();
  });
});

describe('arrowPathAnnotator', () => {
  it('should return "arrow path" for a path cell', () => {
    expect(arrowPathAnnotator.describe('r0c1', ctx)).toBe('arrow path');
  });

  it('should return null for a bulb cell', () => {
    expect(arrowPathAnnotator.describe('r0c0', ctx)).toBeNull();
  });

  it('should return null when structure has no arrows', () => {
    const noArrowCtx: AnnotatorContext = {
      ...ctx,
      model: { ...model, structure: undefined },
    };

    expect(arrowPathAnnotator.describe('r0c1', noArrowCtx)).toBeNull();
  });
});
