import { createSeededRng } from '@/engine/rng';
import { generate } from '@/engine/generate';
import { buildModel } from '@/engine/buildModel';
import { cellIdToLessonCellId } from '@/curriculum/lessonCellId';
import { variantRegistry } from '@/variants/registry';

function parseArgs(args: string[]): { variantId: string; seed?: number } {
  const variantId = args[0];
  if (!variantId || variantId.startsWith('--')) {
    throw new Error('Usage: pnpm lesson:board <variantId> [--seed n]');
  }

  let seed: number | undefined;
  for (let index = 1; index < args.length; index += 1) {
    if (args[index] !== '--seed' || args[index + 1] === undefined || seed !== undefined) {
      throw new Error('Usage: pnpm lesson:board <variantId> [--seed n]');
    }
    seed = Number(args[index + 1]);
    if (!Number.isSafeInteger(seed)) {
      throw new Error(`Invalid seed: ${args[index + 1]}`);
    }
    index += 1;
  }

  return { variantId, seed };
}

function valuesForLesson(
  modelCells: { id: string }[],
  values: Map<string, number>
): Record<string, number> {
  return Object.fromEntries(
    modelCells.flatMap(({ id }) => {
      const value = values.get(id);
      return value === undefined ? [] : [[cellIdToLessonCellId(id), value]];
    })
  );
}

const { variantId, seed } = parseArgs(process.argv.slice(2));
const variant = variantRegistry[variantId];
if (!variant) {
  throw new Error(`Unknown variant: ${variantId}`);
}
if (variant.deriveStructure || variant.deriveGutters) {
  throw new Error(
    `Variant ${variantId} needs a structure field, which lesson boards don't support yet`
  );
}

const model = buildModel(variant);
const rng = seed === undefined ? Math.random : createSeededRng(seed);
const { givens, solution } = generate(model, variant.difficulty, rng);

console.log(
  JSON.stringify(
    {
      board: {
        variant: variant.id,
        givens: valuesForLesson(model.cells, givens),
        solution: valuesForLesson(model.cells, solution),
      },
    },
    null,
    2
  )
);
