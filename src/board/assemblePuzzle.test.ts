import { describe, expect, it } from 'vitest';
import { buildModel } from '@/engine/buildModel';
import type { Solution } from '@/engine/types';
import { getVariant } from '@/variants/registry';
import { isJigsawStructure } from '@/variants/jigsaw';
import { assemblePuzzle, withStructure } from './assemblePuzzle';

describe('withStructure', () => {
  it('should return the model unchanged when there is no structure', () => {
    const baseModel = buildModel(getVariant('classic'));

    expect(withStructure(baseModel, undefined)).toBe(baseModel);
  });

  it('should merge a structure onto the model so constraints can read it', () => {
    const baseModel = buildModel(getVariant('classic'));
    const structure = { regions: [] };

    const merged = withStructure(baseModel, structure) as { structure: unknown };

    expect(merged).not.toBe(baseModel);
    expect(merged.structure).toBe(structure);
  });
});

describe('assemblePuzzle', () => {
  // A variant with no deriveStructure (classic) has nothing to merge, so the
  // model must stay reference-equal to the base model the game already built.
  it('should pass a structureless variant through untouched', () => {
    const variant = getVariant('classic');
    const baseModel = buildModel(variant);

    const { model, structure } = assemblePuzzle(variant, baseModel, new Map() as Solution);

    expect(structure).toBeUndefined();
    expect(model).toBe(baseModel);
  });

  it('should derive structure and merge it onto the model', () => {
    const variant = getVariant('jigsaw');
    const baseModel = buildModel(variant);

    const { model, structure } = assemblePuzzle(variant, baseModel, new Map() as Solution);

    expect(isJigsawStructure(structure)).toBe(true);
    expect(model).not.toBe(baseModel);
    expect((model as { structure: unknown }).structure).toBe(structure);
  });

  it('should be deterministic for a variant with deterministic structure', () => {
    const variant = getVariant('jigsaw');
    const baseModel = buildModel(variant);

    const first = assemblePuzzle(variant, baseModel, new Map() as Solution);
    const second = assemblePuzzle(variant, baseModel, new Map() as Solution);

    expect(second.structure).toEqual(first.structure);
  });
});
