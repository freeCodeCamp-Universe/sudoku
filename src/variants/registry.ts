import type { Variant } from '@/engine/types';
import { classic } from './classic';

export const variantRegistry: Record<string, Variant> = {
  [classic.id]: classic,
};

export function getVariant(id: string): Variant {
  const variant = variantRegistry[id];

  if (!variant) {
    throw new Error(`Unknown variant: ${id}`);
  }

  return variant;
}
