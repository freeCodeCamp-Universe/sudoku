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
  it('should return descriptive wording for a bulb cell', () => {
    expect(arrowBulbAnnotator.describe('r0c0', ctx)).toBe(
      'arrow circle, equals the sum of the 2 cells along its arrow'
    );
  });

  it('should return null for a path cell', () => {
    expect(arrowBulbAnnotator.describe('r0c1', ctx)).toBeNull();
  });

  it('should return null for an unrelated cell', () => {
    expect(arrowBulbAnnotator.describe('r4c4', ctx)).toBeNull();
  });
});

describe('arrowPathAnnotator', () => {
  it('should return descriptive wording for a path cell', () => {
    expect(arrowPathAnnotator.describe('r0c1', ctx)).toBe(
      "arrow path, contributes to its circle's sum"
    );
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

describe('multiple arrows', () => {
  const multiArrows: Arrow[] = [
    { bulb: 'r0c0', path: ['r0c1', 'r0c2'] },
    { bulb: 'r3c0', path: ['r3c1'] },
  ];
  const multiCtx: AnnotatorContext = {
    ...ctx,
    model: { ...model, structure: { arrows: multiArrows } },
  };

  it('should include index for bulb cells', () => {
    expect(arrowBulbAnnotator.describe('r0c0', multiCtx)).toBe(
      'arrow 1 circle, equals the sum of the 2 cells along its arrow'
    );
    expect(arrowBulbAnnotator.describe('r3c0', multiCtx)).toBe(
      'arrow 2 circle, equals the sum of the 1 cell along its arrow'
    );
  });

  it('should include index for path cells', () => {
    expect(arrowPathAnnotator.describe('r0c1', multiCtx)).toBe(
      "arrow 1 path, contributes to its circle's sum"
    );
    expect(arrowPathAnnotator.describe('r3c1', multiCtx)).toBe(
      "arrow 2 path, contributes to its circle's sum"
    );
  });
});
