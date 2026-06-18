import { cellId, shuffle } from '@/engine/grid';
import type { CellId, Solution, Values, Variant, VariantModel } from '@/engine/types';
import { generateGivens9x9 } from './generateGivens9x9';
import type { Chain as ChainType } from '@/engine/constraints/chain';
import { assignValue, createSearchState, pickNextCell, unassignValue } from '@/engine/searchState';

const CHAIN_COLORS = [
  '#99c9ff',
  '#acd157',
  '#f1be32',
  '#ff9966',
  '#cc88ff',
  '#55ddbb',
  '#ff88aa',
  '#88ddff',
  '#ffcc55',
  '#dd88cc',
  '#88ccaa',
  '#ffaa66',
];

// Ties chains to the specific solution object; no timing/race issues
const chainsBySolution = new WeakMap<Solution, ChainType[]>();

function deriveStructure(solution: Solution, _model: VariantModel): { chains: ChainType[] } {
  return { chains: chainsBySolution.get(solution) ?? [] };
}

/** Generate chains FROM a completed solution: walk adjacency graph of consecutive values. */
function extractChainsFromSolution(solution: Values, rng: () => number): ChainType[] {
  const SIZE = 9;
  const DIRS: Array<[number, number]> = [
    [-1, 0],
    [1, 0],
    [0, -1],
    [0, 1],
  ];
  const used = new Set<string>();
  const chains: ChainType[] = [];

  const allCells = shuffle(
    Array.from(
      { length: SIZE * SIZE },
      (_, i) => [Math.floor(i / SIZE), i % SIZE] as [number, number]
    ),
    rng
  );

  for (const [sr, sc] of allCells) {
    const startId = `r${sr}c${sc}`;
    if (used.has(startId)) continue;

    const startVal = solution.get(startId as CellId);
    if (startVal === undefined) continue;

    const targetLen = rng() < 0.5 ? 3 : 4;
    const path: Array<[number, number]> = [[sr, sc]];
    const pathSet = new Set([startId]);
    let r = sr,
      c = sc;

    while (path.length < targetLen) {
      const curVal = solution.get(`r${r}c${c}` as CellId)!;
      // Look for an adjacent unused cell whose value is curVal+1
      const next = shuffle(DIRS, rng)
        .map(([dr, dc]) => [r + dr, c + dc] as [number, number])
        .find(([nr, nc]) => {
          if (nr < 0 || nr >= SIZE || nc < 0 || nc >= SIZE) return false;
          const nId = `r${nr}c${nc}`;
          if (used.has(nId) || pathSet.has(nId)) return false;
          return solution.get(nId as CellId) === curVal + 1;
        });

      if (!next) break;
      [r, c] = next;
      path.push([r, c]);
      pathSet.add(`r${r}c${c}`);
    }

    if (path.length >= 3) {
      for (const [pr, pc] of path) used.add(`r${pr}c${pc}`);
      chains.push({
        cells: path.map(([pr, pc]) => cellId(pr, pc) as CellId),
        color: CHAIN_COLORS[chains.length % CHAIN_COLORS.length],
      });
    }

    if (chains.length >= 12) break;
  }

  return chains;
}

function generateChainSolution(
  model: VariantModel,
  rng: (() => number) | undefined = Math.random
): Solution {
  const safRng = rng ?? Math.random;

  // Generate a standard sudoku solution first, then extract chains from it
  const { generateSolution: _, ...baseModel } = model;
  void _;

  for (let attempt = 0; attempt < 50; attempt++) {
    const values: Values = new Map();
    const state = createSearchState(baseModel as VariantModel, values);

    const solved = (function backtrack(): boolean {
      const { cellId: nextId, candidates } = pickNextCell(
        state,
        values,
        baseModel as VariantModel,
        (c) => shuffle(c, safRng)
      );
      if (nextId === null) return values.size === model.cells.length;
      for (const v of candidates) {
        assignValue(state, values, nextId, v);
        if (backtrack()) return true;
        unassignValue(state, values, nextId, v);
      }
      return false;
    })();

    if (!solved) continue;

    const chains = extractChainsFromSolution(values, safRng);
    if (chains.length >= 8) {
      chainsBySolution.set(values, chains);
      return values;
    }
  }

  throw new Error('Failed to generate chain solution');
}

export const chainVariant: Variant = {
  id: 'chain',
  generateSolution: generateChainSolution,
  name: 'Chain Sudoku',
  description:
    'Colored chains of cells must each hold a complete set of consecutive digits in any order.',
  help: [
    {
      label: 'Basic Rules',
      tone: 'basic',
      rules: [
        {
          term: 'The grid',
          text: 'A standard 9×9 sudoku. Fill every row, column, and 3×3 box with digits 1–9.',
        },
        {
          term: 'Chains',
          text: 'Groups of connected cells are linked by a colored chain running through the grid.',
        },
        {
          term: 'Chain rule',
          text: 'The digits within a chain must be consecutive, forming an unbroken sequence of numbers in any order.',
        },
      ],
    },
    {
      label: 'Additional Rules',
      tone: 'extra',
      rules: [
        {
          term: 'Sequence length',
          text: "A chain of cells holds consecutive digits, such as 4, 5, and 6. The order within the chain doesn't matter.",
        },
        {
          term: 'Sudoku still applies',
          text: 'Every chain cell must also satisfy its row, column, and box.',
        },
      ],
    },
  ],
  popularity: 19,
  generateGivens: generateGivens9x9,
  difficulty: 'intermediate',
  difficultyRank: 1,
  layout: { kind: 'grid', size: 9, box: { rows: 3, cols: 3 } },
  symbols: [1, 2, 3, 4, 5, 6, 7, 8, 9],
  symbolKind: 'digit',
  constraintIds: ['uniqueness', 'chain'],
  overlayIds: ['chain-overlay'],
  annotatorIds: ['chain-cell'],
  deriveStructure,
};
