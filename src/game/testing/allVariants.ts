import type { CellId, House, Variant } from '@/engine/types';
import { variantRegistry } from '@/variants/registry';

export function allVariants(): Variant[] {
  return Object.values(variantRegistry);
}

export function houseCellIds(house: House): CellId[] {
  return house.cells;
}

export const NON_UNIQUE_VARIANTS = new Set<string>([
  // jigsaw: irregular-region uniqueness solving is heavy-tailed, so
  // generateJigsawGivens strips clues to a fixed count WITHOUT proving a unique
  // solution (perf). Generated puzzles can have multiple solutions at some seeds.
  'jigsaw',
]);
