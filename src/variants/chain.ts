import { cellId } from '@/engine/grid';
import type { CellId, Solution, Variant, VariantModel } from '@/engine/types';
import type { Chain as ChainType } from '@/engine/constraints/chain';

const CHAIN_DEFS: Array<Array<readonly [number, number]>> = [
  [[0, 1], [1, 1], [1, 2]],
  [[0, 6], [0, 7], [1, 7], [2, 7]],
  [[3, 0], [4, 0], [4, 1], [4, 2]],
  [[3, 5], [3, 6], [4, 6], [5, 6]],
  [[5, 2], [5, 3], [6, 3]],
  [[7, 5], [7, 6], [8, 6], [8, 7]],
  [[0, 3], [0, 4], [0, 5]],
  [[2, 0], [2, 1], [2, 2]],
  [[1, 3], [1, 4], [1, 5], [1, 6]],
  [[2, 3], [2, 4], [3, 4], [3, 3]],
  [[6, 0], [7, 0], [7, 1], [7, 2]],
  [[5, 8], [6, 8], [7, 8]],
];

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

export const CHAINS: ChainType[] = CHAIN_DEFS.map((cells, index) => ({
  cells: cells.map(([row, col]) => cellId(row, col) as CellId),
  color: CHAIN_COLORS[index],
}));

function deriveStructure(_solution: Solution, _model: VariantModel): { chains: ChainType[] } {
  return { chains: CHAINS };
}

export const chainVariant: Variant = {
  id: 'chain',
  name: 'Chain Sudoku',
  description: 'Colored chains of cells must each contain a set of consecutive digits, in any order.',
  help: [
    {
      label: 'Basic Rules',
      tone: 'basic',
      rules: [
        { term: 'The grid', text: 'A standard 9×9 sudoku. Fill every row, column, and 3×3 box with digits 1–9.' },
        { term: 'Chains', text: 'Groups of connected cells are linked by a colored chain running through the grid.' },
        { term: 'Chain rule', text: 'The digits within a chain must be consecutive, forming an unbroken sequence of numbers in any order.' },
      ],
    },
    {
      label: 'Additional Rules',
      tone: 'extra',
      rules: [
        { term: 'Sequence length', text: 'A chain of three cells holds three consecutive digits, such as 4, 5, and 6. The order within the chain doesn\'t matter.' },
        { term: 'Sudoku still applies', text: 'Every chain cell must also satisfy its row, column, and box.' },
      ],
    },
  ],
  popularity: 19,
  difficulty: 'advanced',
  layout: { kind: 'grid', size: 9, box: { rows: 3, cols: 3 } },
  symbols: [1, 2, 3, 4, 5, 6, 7, 8, 9],
  symbolKind: 'digit',
  constraintIds: ['uniqueness', 'chain'],
  overlayIds: ['chain-overlay'],
  annotatorIds: ['chain-cell'],
  deriveStructure,
};
