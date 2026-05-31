import type { Solution, SymbolValue, Variant, VariantModel } from '@/engine/types';

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

function selectWord(solution: Solution, model: VariantModel): string {
  const checksum = model.cells.reduce(
    (total, cell, index) => total + (solution.get(cell.id) ?? 0) * (index + 1),
    0
  );

  return WORDS[checksum % WORDS.length];
}

export const wordoku: Variant = {
  id: 'wordoku',
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
  difficulty: 'beginner',
  layout: { kind: 'grid', size: 9, box: { rows: 3, cols: 3 } },
  symbols: [1, 2, 3, 4, 5, 6, 7, 8, 9],
  symbolKind: 'letter',
  constraintIds: ['uniqueness'],
  overlayIds: [],
  annotatorIds: [],
  deriveStructure(solution, model): { word: string } {
    return { word: selectWord(solution, model) };
  },
  renderSymbol(value: SymbolValue, structure?: unknown): string {
    const word = (structure as { word?: string } | undefined)?.word;

    return word?.[value - 1] ?? String(value);
  },
};
