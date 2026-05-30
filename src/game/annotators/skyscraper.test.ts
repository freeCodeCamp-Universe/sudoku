import { describe, expect, it } from 'vitest';
import { gridCells, standardHouses } from '@/engine/grid';
import type { VariantModel } from '@/engine/types';
import type { AnnotatorContext, CellState, EdgeClues } from '@/game/gameTypes';
import { skyscraperClueAnnotator } from './skyscraper';

const clues: EdgeClues = {
  top: [2, 3, 4, 5, 1, 6, 2, 3, 4],
  bottom: [4, 2, 3, 1, 5, 2, 3, 4, 2],
  start: [3, 2, 1, 4, 5, 2, 3, 1, 2],
  end: [2, 4, 5, 3, 1, 2, 4, 3, 5],
};

const model: VariantModel = {
  cells: gridCells(9),
  houses: standardHouses(9, { rows: 3, cols: 3 }),
  constraints: [],
  symbols: [1, 2, 3, 4, 5, 6, 7, 8, 9],
  structure: { clues },
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

describe('skyscraperClueAnnotator', () => {
  it('should return null for a regular grid cell (no special annotation)', () => {
    expect(skyscraperClueAnnotator.describe('r0c0', ctx)).toBeNull();
  });

  it('should return null when structure has no clues', () => {
    const noClueCtx: AnnotatorContext = {
      ...ctx,
      model: { ...model, structure: undefined },
    };

    expect(skyscraperClueAnnotator.describe('r0c0', noClueCtx)).toBeNull();
  });
});
