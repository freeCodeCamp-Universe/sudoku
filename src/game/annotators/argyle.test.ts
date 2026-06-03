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
  it('should return descriptive wording for r0c0 (D1 main diagonal)', () => {
    expect(argyleAnnotator.describe('r0c0', ctx())).toBe('argyle diagonal');
  });

  it('should return descriptive wording for r0c5 (D2 stripe r+c=5)', () => {
    expect(argyleAnnotator.describe('r0c5', ctx())).toBe('argyle diagonal');
  });

  it('should return descriptive wording for r4c4 (on both D1 and D2)', () => {
    expect(argyleAnnotator.describe('r4c4', ctx())).toBe('two argyle diagonals');
  });

  it('should return null for r0c1 (not on any argyle stripe)', () => {
    expect(argyleAnnotator.describe('r0c1', ctx())).toBeNull();
  });
});
