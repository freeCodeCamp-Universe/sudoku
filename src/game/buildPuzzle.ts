import { buildModel } from '@/engine/buildModel';
import { generate } from '@/engine/generate';
import { createSeededRng, hashSeed } from '@/engine/rng';
import type { Values, Variant, VariantModel } from '@/engine/types';
import { generateJigsawRegions, makePlayableJigsawVariant } from '@/variants/jigsaw';

export interface BuiltPuzzle {
  model: VariantModel;
  gameVariant: Variant;
  givens: Values;
  solution: Values;
}

export function buildPuzzle(
  variant: Variant,
  jigsawLayoutStart: number,
  genKey: number,
  seedBase: number
): BuiltPuzzle {
  // Jigsaw regions are generated per puzzle from their own seed stream, kept
  // separate from the solution rng so the same regions always reproduce for a
  // saved (jigsawLayoutStart, genKey) pair regardless of generation internals.
  const activeVariant =
    variant.id === 'jigsaw'
      ? makePlayableJigsawVariant(
          generateJigsawRegions(
            createSeededRng(hashSeed('jigsaw-layout', jigsawLayoutStart, genKey))
          )
        )
      : variant;
  const model = buildModel(activeVariant);
  const rng = createSeededRng(hashSeed(variant.id, seedBase, genKey));
  const puzzle = generate(model, variant.difficulty, rng);

  return {
    model,
    gameVariant: activeVariant,
    givens: puzzle.givens,
    solution: puzzle.solution,
  };
}
