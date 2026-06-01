import { describe, expect, it } from 'vitest';
import { buildModel } from '@/engine/buildModel';
import type { AnnotatorContext } from '@/game/gameTypes';
import { getVariant } from '@/variants/registry';
import { windokuAnnotator } from './windoku';

const model = buildModel(getVariant('windoku'));

function ctx(): AnnotatorContext {
  return {
    values: new Map(),
    model,
    cellState: () => ({ candidates: [], given: false, selected: false, conflict: false }),
  };
}

describe('windokuAnnotator', () => {
  it('should return "shaded region" for r1c1 (window-0)', () => {
    expect(windokuAnnotator.describe('r1c1', ctx())).toBe('shaded region');
  });

  it('should return "shaded region" for r1c5 (window-1)', () => {
    expect(windokuAnnotator.describe('r1c5', ctx())).toBe('shaded region');
  });

  it('should return "shaded region" for r5c1 (window-2)', () => {
    expect(windokuAnnotator.describe('r5c1', ctx())).toBe('shaded region');
  });

  it('should return "shaded region" for r7c7 (window-3)', () => {
    expect(windokuAnnotator.describe('r7c7', ctx())).toBe('shaded region');
  });

  it('should return null for r0c0 (not in any window)', () => {
    expect(windokuAnnotator.describe('r0c0', ctx())).toBeNull();
  });
});
