import { buildModel } from '@/engine/buildModel';
import type { Solution, Values, Variant, VariantModel } from '@/engine/types';

export interface ConfiguredPuzzle {
  model: VariantModel;
  givens: Values;
  solution: Solution;
}

export function puzzleFromConfig(
  variant: Variant,
  givens: Values,
  solution: Solution
): ConfiguredPuzzle {
  return {
    model: buildModel(variant),
    givens,
    solution,
  };
}
