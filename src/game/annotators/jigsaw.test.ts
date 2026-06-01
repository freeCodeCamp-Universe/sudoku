import { describe, expect, it } from 'vitest';
import { buildModel } from '@/engine/buildModel';
import type { AnnotatorContext } from '@/game/gameTypes';
import type { JigsawStructure } from '@/variants/jigsaw';
import { getVariant } from '@/variants/registry';
import { jigsawAnnotator } from './jigsaw';

const regions: number[][] = Array.from({ length: 9 }, (_, row) =>
  Array.from({ length: 9 }, () => row)
);
const structure: JigsawStructure = { regions };
const model = buildModel(getVariant('jigsaw'));

function ctx(): AnnotatorContext {
  return {
    values: new Map(),
    model,
    cellState: () => ({ candidates: [], given: false, selected: false, conflict: false }),
  };
}

describe('jigsawAnnotator', () => {
  it('should return "region 0" for r0c0 given regions[0][0]=0', () => {
    expect(jigsawAnnotator(structure).describe('r0c0', ctx())).toBe('region 0');
  });

  it('should return "region 4" for r4c4 given regions[4][4]=4', () => {
    expect(jigsawAnnotator(structure).describe('r4c4', ctx())).toBe('region 4');
  });

  it('should return null for an invalid cell id', () => {
    expect(jigsawAnnotator(structure).describe('rXcY', ctx())).toBeNull();
  });
});
