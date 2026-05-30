import { argyle } from './argyle';
import { asterisk } from './asterisk';
import type { Variant } from '@/engine/types';
import { butterfly } from './butterfly';
import { classic } from './classic';
import { jigsaw } from './jigsaw';
import { samurai } from './samurai';
import { sujiken } from './sujiken';
import { sudokuX } from './sudoku-x';
import { windoku } from './windoku';

export const variantRegistry: Record<string, Variant> = {
  [argyle.id]: argyle,
  [asterisk.id]: asterisk,
  [butterfly.id]: butterfly,
  [classic.id]: classic,
  [jigsaw.id]: jigsaw,
  [samurai.id]: samurai,
  [sujiken.id]: sujiken,
  [sudokuX.id]: sudokuX,
  [windoku.id]: windoku,
};

export function getVariant(id: string): Variant {
  const variant = variantRegistry[id];

  if (!variant) {
    throw new Error(`Unknown variant: ${id}`);
  }

  return variant;
}
