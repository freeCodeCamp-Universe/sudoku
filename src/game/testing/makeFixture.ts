import { buildModel } from '@/engine/buildModel';
import { generate } from '@/engine/generate';
import type { CellId, Solution, Values, Variant, VariantModel } from '@/engine/types';
import type { Rect, Size } from '@/game/gameTypes';
import { resolveLayout } from '@/game/layouts/registry';

export interface Fixture {
  model: VariantModel;
  rects: Map<CellId, Rect>;
  size: Size;
  solution: Solution;
  givens: Values;
  structure: unknown;
  parityMap?: Map<CellId, 0 | 1>;
}

export function seeded(seed: number): () => number {
  let state = seed;

  return () => {
    state = (state * 1103515245 + 12345) & 0x7fffffff;
    return state / 0x7fffffff;
  };
}

function getParityMap(structure: unknown): Map<CellId, 0 | 1> | undefined {
  if (!structure || typeof structure !== 'object' || !('parityMap' in structure)) {
    return undefined;
  }

  return (structure as { parityMap: Map<CellId, 0 | 1> }).parityMap;
}

export function makeFixture(variant: Variant, seed = 1): Fixture {
  const model = buildModel(variant);
  const layout = resolveLayout(variant.layout.kind);
  const { solution, givens } = generate(model, 'intermediate', seeded(seed));
  const structure = variant.deriveStructure?.(solution, model);

  return {
    model,
    rects: layout.cellRects(variant),
    size: layout.canvasSize(variant),
    solution,
    givens,
    structure,
    parityMap: getParityMap(structure),
  };
}
