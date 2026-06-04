import { shuffle } from '@/engine/grid';
import { assignValue, createSearchState, pickNextCell, unassignValue } from '@/engine/searchState';
import type { CellId, Solution, SymbolValue, Values, Variant, VariantModel } from '@/engine/types';
import { generateGivens9x9 } from './generateGivens9x9';

const wordBySolution = new WeakMap<Solution, string>();

export const WORDS = [
  'WONDERFUL',
  'BLACKOUTS',
  'KEYBOARDS',
  'SLAUGHTER',
  'BIRTHDAYS',
  'FACTORING',
  'COUPLINGS',
  'OUTBREAKS',
  'EXPLORING',
  'BENCHMARK',
  'NIGHTCLUB',
  'WATCHDOGS',
  'CLIPBOARD',
  'DOWNRIGHT',
  'PITCHFORK',
  'BACKSTORY',
  'SNOWFLAKE',
  'DRAGONFLY',
  'WORKPLACE',
  'PATCHWORK',
  'GREYHOUND',
  'STOCKPILE',
  'SHORTWAVE',
  'PLAYHOUSE',
  'DRUMBEATS',
  'FILAMENTS',
];

function generateWordokuSolution(model: VariantModel, rng: (() => number) | undefined = Math.random): Solution {
  const safRng = rng ?? Math.random;
  const word = shuffle([...WORDS], safRng)[0];
  const rows = shuffle([0, 1, 2, 3, 4, 5, 6, 7, 8], safRng);

  for (const wordRow of rows) {
    const values: Values = new Map();
    for (let c = 0; c < 9; c++) {
      values.set(`r${wordRow}c${c}` as CellId, (c + 1) as SymbolValue);
    }

    const state = createSearchState(model, values);
    const solved = (function backtrack(): boolean {
      const { cellId: nextId, candidates } = pickNextCell(state, values, model, (cands) =>
        shuffle(cands, safRng)
      );
      if (nextId === null) return values.size === model.cells.length;
      for (const v of candidates) {
        assignValue(state, values, nextId, v);
        if (backtrack()) return true;
        unassignValue(state, values, nextId, v);
      }
      return false;
    })();

    if (solved) {
      wordBySolution.set(values, word);
      return values;
    }
  }

  throw new Error('Failed to generate wordoku solution');
}

export const wordoku: Variant = {
  id: 'wordoku',
  generateSolution: generateWordokuSolution,
  name: 'Wordoku',
  description: 'Letters replace digits using a hidden nine-letter word. Find it reading across one row or down one column.',
  help: [
    {
      label: 'Basic Rules',
      tone: 'basic',
      rules: [
        { term: 'The grid', text: 'A standard 9×9 sudoku grid. Fill every row, column, and 3×3 box with each of nine letters exactly once.' },
        { term: 'The letters', text: 'All nine letters come from a hidden word shown below the grid.' },
        { term: 'Same logic', text: 'Placement rules are identical to classic sudoku, just with letters instead of digits.' },
      ],
    },
    {
      label: 'Additional Rules',
      tone: 'extra',
      rules: [
        { term: 'Find the word', text: 'Once solved, one complete row or column spells out the hidden word in order. See if you can spot it.' },
        { term: 'Entering letters', text: 'Use the letter buttons on screen or type the letters directly on your keyboard.' },
      ],
    },
  ],
  popularity: 14,
  generateGivens: generateGivens9x9,
  difficulty: 'beginner',
  layout: { kind: 'grid', size: 9, box: { rows: 3, cols: 3 } },
  symbols: [1, 2, 3, 4, 5, 6, 7, 8, 9],
  symbolKind: 'letter',
  constraintIds: ['uniqueness'],
  overlayIds: [],
  annotatorIds: [],
  deriveStructure(solution): { word: string } {
    return { word: wordBySolution.get(solution) ?? WORDS[0] };
  },
  renderSymbol(value: SymbolValue, structure?: unknown): string {
    const word = (structure as { word?: string } | undefined)?.word;

    return word?.[value - 1] ?? String(value);
  },
};
