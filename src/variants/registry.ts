import { arrow } from './arrow';
import { argyle } from './argyle';
import { asterisk } from './asterisk';
import { centerDot } from './centerDot';
import { girandola } from './girandola';
import type { Variant } from '@/engine/types';
import { butterfly } from './butterfly';
import { cross } from './cross';
import { flower } from './flower';
import { chainVariant } from './chain';
import { classic } from './classic';
import { color } from './color';
import { consecutiveVariant } from './consecutive';
import { evenOdd } from './evenOdd';
import { greaterThanVariant } from './greaterThan';
import { jigsaw } from './jigsaw';
import { killer } from './killer';
import { mini } from './mini';
import { samurai } from './samurai';
import { skyscraper } from './skyscraper';
import { super16 } from './super16';
import { sujiken } from './sujiken';
import { sudokuX } from './sudoku-x';
import { windoku } from './windoku';
import { wordoku } from './wordoku';

export const variantRegistry: Record<string, Variant> = {
  [arrow.id]: arrow,
  [argyle.id]: argyle,
  [asterisk.id]: asterisk,
  [centerDot.id]: centerDot,
  [girandola.id]: girandola,
  [butterfly.id]: butterfly,
  [cross.id]: cross,
  [flower.id]: flower,
  [chainVariant.id]: chainVariant,
  [classic.id]: classic,
  [color.id]: color,
  [consecutiveVariant.id]: consecutiveVariant,
  [evenOdd.id]: evenOdd,
  [greaterThanVariant.id]: greaterThanVariant,
  [jigsaw.id]: jigsaw,
  [killer.id]: killer,
  [mini.id]: mini,
  [samurai.id]: samurai,
  [skyscraper.id]: skyscraper,
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
