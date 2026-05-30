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
  difficulty: 'intermediate',
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
