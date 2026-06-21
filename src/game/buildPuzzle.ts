import { buildModel } from '@/engine/buildModel';
import { generate } from '@/engine/generate';
import { createSeededRng, hashSeed } from '@/engine/rng';
import type { Values, Variant, VariantModel } from '@/engine/types';
import { makePlayableJigsawVariant, PRESET_LAYOUTS } from '@/variants/jigsaw';

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
  const activeVariant =
    variant.id === 'jigsaw'
      ? makePlayableJigsawVariant(
          PRESET_LAYOUTS[(jigsawLayoutStart + genKey) % PRESET_LAYOUTS.length]
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
