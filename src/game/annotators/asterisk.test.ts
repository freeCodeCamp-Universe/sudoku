import { describe, expect, it } from 'vitest';
import { buildModel } from '@/engine/buildModel';
import type { AnnotatorContext } from '@/game/gameTypes';
import { getVariant } from '@/variants/registry';
import { asteriskAnnotator } from './asterisk';

const model = buildModel(getVariant('asterisk'));

function ctx(): AnnotatorContext {
  return {
    values: new Map(),
    model,
    cellState: () => ({ candidates: [], given: false, selected: false, conflict: false }),
  };
}

describe('asteriskAnnotator', () => {
  it('should return descriptive wording for r1c4', () => {
    expect(asteriskAnnotator.describe('r1c4', ctx())).toBe('asterisk region');
  });

  it('should return descriptive wording for r4c4 (center)', () => {
    expect(asteriskAnnotator.describe('r4c4', ctx())).toBe('asterisk region');
  });

  it('should return descriptive wording for r7c4', () => {
    expect(asteriskAnnotator.describe('r7c4', ctx())).toBe('asterisk region');
  });

  it('should return null for r0c0 (not in asterisk)', () => {
    expect(asteriskAnnotator.describe('r0c0', ctx())).toBeNull();
  });
});
