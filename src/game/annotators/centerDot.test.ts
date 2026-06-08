import { describe, expect, it } from 'vitest';
import { buildModel } from '@/engine/buildModel';
import type { AnnotatorContext } from '@/game/gameTypes';
import { getVariant } from '@/variants/registry';
import { centerDotAnnotator } from './centerDot';

const model = buildModel(getVariant('center-dot'));

function ctx(): AnnotatorContext {
  return {
    values: new Map(),
    model,
    cellState: () => ({ candidates: [], given: false, selected: false, conflict: false }),
  };
}

describe('centerDotAnnotator', () => {
  it('should return descriptive wording for r1c1 (top-left box center)', () => {
    expect(centerDotAnnotator.describe('r1c1', ctx())).toBe('center dot region');
  });

  it('should return descriptive wording for r4c4 (middle box center)', () => {
    expect(centerDotAnnotator.describe('r4c4', ctx())).toBe('center dot region');
  });

  it('should return descriptive wording for r7c7 (bottom-right box center)', () => {
    expect(centerDotAnnotator.describe('r7c7', ctx())).toBe('center dot region');
  });

  it('should return null for r0c0 (not a center dot cell)', () => {
    expect(centerDotAnnotator.describe('r0c0', ctx())).toBeNull();
  });

  it('should return null for r4c3 (not a center dot cell)', () => {
    expect(centerDotAnnotator.describe('r4c3', ctx())).toBeNull();
  });
});
