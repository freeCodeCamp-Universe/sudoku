import type { CellId, House, Variant } from '@/engine/types';
import { variantRegistry } from '@/variants/registry';

export function allVariants(): Variant[] {
  return Object.values(variantRegistry);
}

export function houseCellIds(house: House): CellId[] {
  return house.cells;
}
