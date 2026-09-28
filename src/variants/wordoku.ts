import { shuffle } from '@/engine/grid';
import { assignValue, createSearchState, pickNextCell, unassignValue } from '@/engine/searchState';
import type { CellId, Solution, SymbolValue, Values, Variant, VariantModel } from '@/engine/types';
import { generateGivens9x9 } from './generateGivens9x9';

const wordBySolution = new WeakMap<Solution, string>();

export const WORDS = [
  'WONDERFUL',
  'SNOWFLAKE',
  'DRAGONFLY',
  'BIRTHDAYS',
  'EXPLORING',
  'PLAYHOUSE',
  'DRUMBEATS',
  'SPARKLING',
  'FLOWERING',
  'WELCOMING',
  'SUNFLOWER',
  'BRIGHTENS',
  'TRIUMPHED',
  'DISCOVERY',
  'LOVEBIRDS',
  'NOURISHED',
  'MASTERFUL',
  'DAYSPRING',
  'EMBRACING',
  'SUNBATHED',
  'WINDHOVER',
  'CHAMPIONS',
  'RIGHTEOUS',
  'HARMONIZE',
  'WARBLINGS',
  'LIFEGUARD',
];

function generateWordokuSolution(
  model: VariantModel,
  rng: (() => number) | undefined = Math.random
): Solution {
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
  description:
    'Letters replace digits. A hidden nine-letter word runs across one complete row or down one column.',
  help: [
    {
      label: 'Basic Rules',
      tone: 'basic',
      rules: [
        {
          term: 'The board',
          text: 'A 9×9 board divided into nine 3×3 boxes. Fill every cell with a symbol from A to Z.',
        },
        {
          term: 'Rows and columns',
          text: 'Every row and every column must contain each symbol exactly once.',
        },
        {
          term: 'Boxes',
          text: 'Each of the nine 3×3 boxes must also hold every symbol exactly once.',
        },
      ],
    },
    {
      label: 'Additional Rules',
      tone: 'extra',
      rules: [
        {
          term: 'Find the word',
          text: 'Once solved, one complete row or column spells out the hidden word in order. See if you can spot it.',
        },
      ],
    },
  ],
  popularity: 14,
  generateGivens: generateGivens9x9,
  difficulty: 'intermediate',
  difficultyRank: 4,
  layout: { kind: 'grid', size: 9, box: { rows: 3, cols: 3 } },
  symbols: [1, 2, 3, 4, 5, 6, 7, 8, 9],
  symbolKind: 'letter',
  constraintIds: ['uniqueness'],
  overlayIds: [],
  annotatorIds: ['wordoku'],
  deriveStructure(solution): { word: string } {
    return { word: wordBySolution.get(solution) ?? WORDS[0] };
  },
  lessonStructure(raw: unknown, solution: Solution, model: VariantModel): { word: string } {
    if (
      typeof raw !== 'object' ||
      raw === null ||
      Array.isArray(raw) ||
      Object.keys(raw).length !== 1 ||
      !Object.prototype.hasOwnProperty.call(raw, 'word')
    ) {
      throw new Error('structure must contain only a word field');
    }

    const { word } = raw as { word?: unknown };
    if (typeof word !== 'string' || !/^[A-Z]{9}$/.test(word)) {
      throw new Error('word must be 9 uppercase letters A-Z');
    }
    if (new Set(word).size !== 9) {
      throw new Error('word must not contain repeated letters');
    }

    const hasWordLine = (axis: 'row' | 'col') => {
      const lineCount = Math.max(...model.cells.map((cell) => cell[axis])) + 1;
      for (let line = 0; line < lineCount; line += 1) {
        const cells = model.cells
          .filter((cell) => cell[axis] === line)
          .sort(
            (left, right) =>
              left[axis === 'row' ? 'col' : 'row'] - right[axis === 'row' ? 'col' : 'row']
          );
        if (
          cells.length === 9 &&
          cells.every((cell, index) => solution.get(cell.id) === index + 1)
        ) {
          return true;
        }
      }
      return false;
    };

    if (!hasWordLine('row') && !hasWordLine('col')) {
      throw new Error('word must match a row or column of the solution that reads 1-9');
    }
    return { word };
  },
  renderSymbol(value: SymbolValue, structure?: unknown): string {
    const word = (structure as { word?: string } | undefined)?.word;

    return word?.[value - 1] ?? String(value);
  },
};
