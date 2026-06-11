import { cellId, range } from '@/engine/grid';
import type { BoardLayout, House, Variant } from '@/engine/types';
import { generateGivens9x9 } from './generateGivens9x9';

const ARGYLE_SIZE = 9;

export const ARGYLE_D1_OFFSETS = [-4, -1, 1, 4] as const;
export const ARGYLE_D2_SUMS = [4, 7, 9, 12] as const;

function buildD1Stripe(offset: number): string[] {
  return range(ARGYLE_SIZE)
    .map((row) => ({ row, col: row - offset }))
    .filter(({ col }) => col >= 0 && col < ARGYLE_SIZE)
    .map(({ row, col }) => cellId(row, col));
}

function buildD2Stripe(sum: number): string[] {
  return range(ARGYLE_SIZE)
    .map((row) => ({ row, col: sum - row }))
    .filter(({ col }) => col >= 0 && col < ARGYLE_SIZE)
    .map(({ row, col }) => cellId(row, col));
}

function argyleExtraHouses(_layout: BoardLayout): House[] {
  const houses: House[] = [];

  for (const offset of ARGYLE_D1_OFFSETS) {
    const label = offset < 0 ? `m${Math.abs(offset)}` : String(offset);
    houses.push({ id: `argyle-d1-${label}`, cells: buildD1Stripe(offset) });
  }

  for (const sum of ARGYLE_D2_SUMS) {
    houses.push({ id: `argyle-d2-${sum}`, cells: buildD2Stripe(sum) });
  }

  return houses;
}

export function isArgyleCell(cell: string): boolean {
  const match = /^r(\d+)c(\d+)$/.exec(cell);

  if (!match) {
    return false;
  }

  const row = Number.parseInt(match[1], 10);
  const col = Number.parseInt(match[2], 10);

  if (row < 0 || row >= ARGYLE_SIZE || col < 0 || col >= ARGYLE_SIZE) {
    return false;
  }

  return ARGYLE_D1_OFFSETS.includes((row - col) as (typeof ARGYLE_D1_OFFSETS)[number])
    || ARGYLE_D2_SUMS.includes((row + col) as (typeof ARGYLE_D2_SUMS)[number]);
}

export const argyle: Variant = {
  id: 'argyle',
  name: 'Argyle Sudoku',
  description: 'The grid is overlaid with an argyle diamond. Each marked diagonal stripe must contain distinct digits.',
  help: [
    {
      label: 'Basic Rules',
      tone: 'basic',
      rules: [
        { term: 'The grid', text: 'A standard 9×9 sudoku. Fill every row, column, and 3×3 box with digits 1–9.' },
        { term: 'Argyle pattern', text: 'Diagonal lines are drawn across the grid forming an argyle diamond pattern. The marked cells belong to diagonal stripes.' },
        { term: 'Diagonal rule', text: 'No digit may repeat within any single diagonal stripe.' },
      ],
    },
    {
      label: 'Additional Rules',
      tone: 'extra',
      rules: [
        { term: 'Variable lengths', text: 'Stripes vary in length. Shorter ones near the corners need fewer digits, but repeats are still forbidden within each stripe.' },
        { term: 'Empty diamonds', text: 'Cells inside the empty diamond shapes are not part of any diagonal stripe and only follow the standard row, column, and box rules.' },
      ],
    },
  ],
  popularity: 17,
  generateGivens: generateGivens9x9,
  difficulty: 'advanced',
  difficultyRank: 4,
  layout: { kind: 'grid', size: 9, box: { rows: 3, cols: 3 } },
  symbols: [1, 2, 3, 4, 5, 6, 7, 8, 9],
  constraintIds: ['uniqueness'],
  extraHouses: argyleExtraHouses,
  peerHouseFilter: (house) => !house.id.startsWith('argyle-'),
  overlayIds: ['argyle'],
  annotatorIds: ['argyle'],
};
