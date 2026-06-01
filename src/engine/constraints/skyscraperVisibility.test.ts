import { describe, expect, it } from 'vitest';
import { cellId, gridCells, standardHouses } from '../grid';
import type { VariantModel, Values } from '../types';
import { skyscraperVisibility } from './skyscraperVisibility';
import type { EdgeClues } from '@/game/gameTypes';

function makeModel(clues: EdgeClues): VariantModel {
  return {
    cells: gridCells(9),
    houses: standardHouses(9, { rows: 3, cols: 3 }),
    constraints: [],
    symbols: [1, 2, 3, 4, 5, 6, 7, 8, 9],
    structure: { clues },
  };
}

const ASCENDING = [1, 2, 3, 4, 5, 6, 7, 8, 9];

function fillRow(values: Values, row: number, entries: number[]): void {
  entries.forEach((value, col) => values.set(cellId(row, col), value));
}

describe('skyscraperVisibility constraint', () => {
  it('should report a conflict when the start clue does not match visible count', () => {
    const clues: EdgeClues = {
      top: Array(9).fill(0),
      bottom: Array(9).fill(0),
      start: [1, 0, 0, 0, 0, 0, 0, 0, 0],
      end: Array(9).fill(0),
    };
    const values: Values = new Map();

    fillRow(values, 0, ASCENDING);

    const conflicts = skyscraperVisibility.conflicts(values, makeModel(clues));
    expect(conflicts.some((conflict) => conflict.constraintId === 'skyscraperVisibility')).toBe(
      true
    );
  });

  it('should report no conflict when the start clue matches visible count', () => {
    const clues: EdgeClues = {
      top: Array(9).fill(0),
      bottom: Array(9).fill(0),
      start: [9, 0, 0, 0, 0, 0, 0, 0, 0],
      end: Array(9).fill(0),
    };
    const values: Values = new Map();

    fillRow(values, 0, ASCENDING);

    expect(skyscraperVisibility.conflicts(values, makeModel(clues))).toEqual([]);
  });

  it('should not check a row that is only partially filled', () => {
    const clues: EdgeClues = {
      top: Array(9).fill(0),
      bottom: Array(9).fill(0),
      start: [1, 0, 0, 0, 0, 0, 0, 0, 0],
      end: Array(9).fill(0),
    };
    const values: Values = new Map([['r0c0', 9]]);

    expect(skyscraperVisibility.conflicts(values, makeModel(clues))).toEqual([]);
  });

  it('should report a conflict when the top column clue does not match', () => {
    const clues: EdgeClues = {
      top: [1, 0, 0, 0, 0, 0, 0, 0, 0],
      bottom: Array(9).fill(0),
      start: Array(9).fill(0),
      end: Array(9).fill(0),
    };
    const values: Values = new Map();

    ASCENDING.forEach((value, row) => values.set(cellId(row, 0), value));
    for (let row = 0; row < 9; row += 1) {
      for (let col = 1; col < 9; col += 1) {
        values.set(cellId(row, col), ((row + col) % 9) + 1);
      }
    }

    const conflicts = skyscraperVisibility.conflicts(values, makeModel(clues));
    expect(conflicts.some((conflict) => conflict.constraintId === 'skyscraperVisibility')).toBe(
      true
    );
  });

  it('should be a no-op when structure is absent', () => {
    const model: VariantModel = {
      cells: gridCells(9),
      houses: [],
      constraints: [],
      symbols: [1, 2, 3, 4, 5, 6, 7, 8, 9],
    };
    const values: Values = new Map();

    fillRow(values, 0, ASCENDING);

    expect(skyscraperVisibility.conflicts(values, model)).toEqual([]);
  });
});
