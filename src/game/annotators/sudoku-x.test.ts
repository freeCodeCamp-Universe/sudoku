import { describe, expect, it } from 'vitest';
import { buildModel } from '@/engine/buildModel';
import type { AnnotatorContext } from '@/game/gameTypes';
import { getVariant } from '@/variants/registry';
import { sudokuXAnnotator } from './sudoku-x';

const model = buildModel(getVariant('sudoku-x'));

function ctx(): AnnotatorContext {
  return {
    values: new Map(),
    model,
    cellState: () => ({ candidates: [], given: false, selected: false, conflict: false }),
  };
}

describe('sudokuXAnnotator', () => {
  it('should return "on main diagonal" for r0c0', () => {
    expect(sudokuXAnnotator.describe('r0c0', ctx())).toBe('on main diagonal');
  });

  it('should return "on anti-diagonal" for r0c8', () => {
    expect(sudokuXAnnotator.describe('r0c8', ctx())).toBe('on anti-diagonal');
  });

  it('should return "on both diagonals" for r4c4', () => {
    expect(sudokuXAnnotator.describe('r4c4', ctx())).toBe('on both diagonals');
  });

  it('should return null for a cell not on either diagonal', () => {
    expect(sudokuXAnnotator.describe('r0c1', ctx())).toBeNull();
  });
});
