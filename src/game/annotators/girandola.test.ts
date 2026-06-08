import { describe, expect, it } from 'vitest';
import { buildModel } from '@/engine/buildModel';
import type { AnnotatorContext } from '@/game/gameTypes';
import { getVariant } from '@/variants/registry';
import { girandolaAnnotator } from './girandola';

const model = buildModel(getVariant('girandola'));

function ctx(): AnnotatorContext {
  return {
    values: new Map(),
    model,
    cellState: () => ({ candidates: [], given: false, selected: false, conflict: false }),
  };
}

describe('girandolaAnnotator', () => {
  it('should return descriptive wording for r0c0 (top-left corner)', () => {
    expect(girandolaAnnotator.describe('r0c0', ctx())).toBe('girandola region');
  });

  it('should return descriptive wording for r4c4 (center)', () => {
    expect(girandolaAnnotator.describe('r4c4', ctx())).toBe('girandola region');
  });

  it('should return descriptive wording for r8c8 (bottom-right corner)', () => {
    expect(girandolaAnnotator.describe('r8c8', ctx())).toBe('girandola region');
  });

  it('should return null for r0c1 (not in girandola)', () => {
    expect(girandolaAnnotator.describe('r0c1', ctx())).toBeNull();
  });

  it('should return null for r4c3 (not in girandola)', () => {
    expect(girandolaAnnotator.describe('r4c3', ctx())).toBeNull();
  });
});
