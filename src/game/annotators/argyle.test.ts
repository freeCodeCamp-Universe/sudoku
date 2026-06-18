import { describe, expect, it } from 'vitest';
import { buildModel } from '@/engine/buildModel';
import type { AnnotatorContext } from '@/game/gameTypes';
import { getVariant } from '@/variants/registry';
import { argyleAnnotator } from './argyle';

const model = buildModel(getVariant('argyle'));

function ctx(): AnnotatorContext {
  return {
    values: new Map(),
    model,
    cellState: () => ({ candidates: [], given: false, selected: false, conflict: false }),
  };
}

describe('argyleAnnotator', () => {
  it('should return descriptive wording for r0c1 (D1 only, offset -1)', () => {
    expect(argyleAnnotator.describe('r0c1', ctx())).toBe('argyle diagonal');
  });

  it('should return descriptive wording for r0c7 (D2 only, sum 7)', () => {
    expect(argyleAnnotator.describe('r0c7', ctx())).toBe('argyle diagonal');
  });

  it('should return descriptive wording for r0c4 (D1 offset -4 and D2 sum 4)', () => {
    expect(argyleAnnotator.describe('r0c4', ctx())).toBe('two argyle diagonals');
  });

  it('should return null for r4c4 (center, on no stripe)', () => {
    expect(argyleAnnotator.describe('r4c4', ctx())).toBeNull();
  });
});
