import type { Variant } from '@/engine/types';
import { butterfly } from './butterfly';
import { classic } from './classic';
import { samurai } from './samurai';
import { sujiken } from './sujiken';

export const variantRegistry: Record<string, Variant> = {
  [butterfly.id]: butterfly,
  [classic.id]: classic,
  [samurai.id]: samurai,
  [sujiken.id]: sujiken,
};

export function getVariant(id: string): Variant {
  const variant = variantRegistry[id];

  if (!variant) {
    throw new Error(`Unknown variant: ${id}`);
  }

  return variant;
}
