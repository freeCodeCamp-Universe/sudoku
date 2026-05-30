import { argyle } from './argyle';
import { asterisk } from './asterisk';
import type { Variant } from '@/engine/types';
import { butterfly } from './butterfly';
import { classic } from './classic';
import { color } from './color';
import { evenOdd } from './evenOdd';
import { jigsaw } from './jigsaw';
import { mini } from './mini';
import { samurai } from './samurai';
import { super16 } from './super16';
import { sujiken } from './sujiken';
import { sudokuX } from './sudoku-x';
import { windoku } from './windoku';
import { wordoku } from './wordoku';

export const variantRegistry: Record<string, Variant> = {
  [argyle.id]: argyle,
  [asterisk.id]: asterisk,
  [butterfly.id]: butterfly,
  [classic.id]: classic,
  [color.id]: color,
  [evenOdd.id]: evenOdd,
  [jigsaw.id]: jigsaw,
  [mini.id]: mini,
  [samurai.id]: samurai,
  [super16.id]: super16,
  [sujiken.id]: sujiken,
  [sudokuX.id]: sudokuX,
  [windoku.id]: windoku,
  [wordoku.id]: wordoku,
};

export function getVariant(id: string): Variant {
  const variant = variantRegistry[id];

  if (!variant) {
    throw new Error(`Unknown variant: ${id}`);
  }

  return variant;
}
