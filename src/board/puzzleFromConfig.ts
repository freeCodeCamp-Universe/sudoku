import { buildModel } from '@/engine/buildModel';
import type { Solution, Values, Variant, VariantModel } from '@/engine/types';
import { withStructure } from '@/board/assemblePuzzle';

export interface ConfiguredPuzzle {
  model: VariantModel;
  givens: Values;
  solution: Solution;
}

export function puzzleFromConfig(
  variant: Variant,
  givens: Values,
  solution: Solution,
  structure?: unknown
): ConfiguredPuzzle {
  return {
    model: withStructure(buildModel(variant), structure),
    givens,
    solution,
  };
}
