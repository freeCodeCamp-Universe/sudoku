import type { Solution, Variant, VariantModel } from '@/engine/types';

export interface AssembledPuzzle {
  // The model solve/validate run against, with any derived structure merged in.
  model: VariantModel;
  structure: unknown;
}

// Merge a variant's derived structure onto the model so validate() can run the
// constraints that read it (killer cages, kropki marks, sandwich/skyscraper
// clues, ...). Returns the model unchanged when the variant has no structure.
// Exposed on its own so callers holding an already-derived structure (e.g. one
// carved non-deterministically and captured in a fixture) reuse it instead of
// re-deriving and getting a different one.
export function withStructure(baseModel: VariantModel, structure: unknown): VariantModel {
  return structure === undefined ? baseModel : { ...baseModel, structure };
}

// Phase 2 of puzzle setup: derive the structure from a generated solution and
// merge it onto the model the running board solves and validates against. Pure
// and non-React so the game runtime and the test harness share one assembly.
// Phase 1 (generation) lives in buildPuzzle.ts.
export function assemblePuzzle(
  variant: Variant,
  baseModel: VariantModel,
  solution: Solution
): AssembledPuzzle {
  const structure = variant.deriveStructure?.(solution, baseModel);

  return { model: withStructure(baseModel, structure), structure };
}
