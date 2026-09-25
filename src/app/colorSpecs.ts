import type { CellId, Variant } from '@/engine/types';
import { sudokuX } from '@/variants/sudoku-x';
import { windoku } from '@/variants/windoku';
import { asterisk } from '@/variants/asterisk';
import { centerDot } from '@/variants/centerDot';
import { girandola } from '@/variants/girandola';
import { evenOdd } from '@/variants/evenOdd';

export interface ColorSpec {
  variantImport: string;
  variant: Variant;
  cell: CellId;
  marker: string;
  token: string;
  kind: 'positional' | 'value-derived';
}

// Positional markers are wired in Board.tsx from each variant's exported cell
// set (MAIN_DIAGONAL_CELLS, WINDOKU_WINDOWS, ASTERISK_CELLS, CENTER_DOT_CELLS,
// GIRANDOLA_CELLS). Value-derived markers come from the fixture's parityMap.
// Cell ids below are confirmed against those sources; even-odd ids are pinned
// to makeFixture(evenOdd) seed 1 (the renderVariantBoard default).
export const colorSpecs: ColorSpec[] = [
  {
    variantImport: 'sudoku-x',
    variant: sudokuX,
    cell: 'r0c0',
    marker: 'data-diagonal',
    token: '--cell-diagonal-bg',
    kind: 'positional',
  },
  {
    variantImport: 'windoku',
    variant: windoku,
    cell: 'r1c1',
    marker: 'data-window',
    token: '--cell-window-bg',
    kind: 'positional',
  },
  {
    variantImport: 'asterisk',
    variant: asterisk,
    cell: 'r4c4',
    marker: 'data-asterisk',
    token: '--cell-special-bg',
    kind: 'positional',
  },
  {
    variantImport: 'center-dot',
    variant: centerDot,
    cell: 'r1c1',
    marker: 'data-center-dot',
    token: '--cell-special-bg',
    kind: 'positional',
  },
  {
    variantImport: 'girandola',
    variant: girandola,
    cell: 'r0c0',
    marker: 'data-girandola',
    token: '--cell-special-bg',
    kind: 'positional',
  },
  {
    variantImport: 'even-odd',
    variant: evenOdd,
    cell: 'r0c3',
    marker: 'data-even',
    token: '--cell-even-bg',
    kind: 'value-derived',
  },
  {
    variantImport: 'even-odd',
    variant: evenOdd,
    cell: 'r0c0',
    marker: 'data-odd',
    token: '--cell-odd-bg',
    kind: 'value-derived',
  },
];

// Colors NOT covered by this table, and where each is covered instead:
// - cell fill / box / diagonal / window / special / even / odd backgrounds:
//   theme.css tokens, value-pinned in Task 4 / asserted here.
// - cage strokes (killer) and argyle diagonal strokes: overlay theme tokens,
//   covered by Task 5 overlay token tests.
// - kropki dots, greater-than chevrons, arrow strokes, consecutive bars:
//   canvas/overlay annotators, not theme-token cell fills.
// - overlapping-grid preview overlap shading (samurai, butterfly, cross,
//   flower, gattai-3, sohei, twodoku, tripledoku, kazaguruma): preview tokens,
//   covered by Task 7 (previewColors.test.ts).
// - chain colors: CHAIN_COLORS in src/variants/chain.ts is a 12-entry
//   categorical JS palette assigned cyclically per chain and painted on canvas.
//   Decision: JS-owned, NOT tokenized (no dark/light pairing; one palette reads
//   on both themes). Pinned by the CHAIN_COLORS value test in colorSpecs.test.tsx.
