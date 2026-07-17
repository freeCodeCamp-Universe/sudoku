import { buildModel } from '@/engine/buildModel';
import { cellId, range, shuffle } from '@/engine/grid';
import { findSolution } from '@/engine/solve';
import type {
  BoardLayout,
  Difficulty,
  House,
  Solution,
  Values,
  Variant,
  VariantModel,
} from '@/engine/types';

const JIGSAW_SIZE = 9;

export interface JigsawStructure {
  regions: number[][];
}

// Every layout must admit a valid filling and solve quickly from a blank grid;
// an unsolvable or near-unsolvable partition freezes generation. Layouts 1 and 2
// are rotations/reflections of layout 0, which preserve both solvability and the
// nine-cell region shapes while giving the board a visibly different look.
export const PRESET_LAYOUTS: number[][][] = [
  [
    [0, 0, 0, 1, 1, 1, 2, 2, 2],
    [0, 1, 1, 1, 1, 2, 2, 2, 2],
    [0, 0, 0, 1, 1, 2, 2, 3, 3],
    [0, 4, 4, 4, 4, 5, 5, 3, 3],
    [0, 4, 4, 4, 4, 5, 5, 3, 3],
    [6, 6, 6, 6, 4, 5, 5, 3, 3],
    [6, 6, 6, 6, 6, 5, 5, 5, 3],
    [7, 7, 7, 7, 7, 8, 8, 8, 8],
    [7, 7, 7, 7, 8, 8, 8, 8, 8],
  ],
  [
    [2, 2, 3, 3, 3, 3, 3, 8, 8],
    [2, 2, 3, 3, 3, 3, 5, 8, 8],
    [2, 2, 2, 5, 5, 5, 5, 8, 8],
    [1, 2, 2, 5, 5, 5, 5, 8, 8],
    [1, 1, 1, 4, 4, 4, 6, 7, 8],
    [1, 1, 1, 4, 4, 6, 6, 7, 7],
    [0, 1, 0, 4, 4, 6, 6, 7, 7],
    [0, 1, 0, 4, 4, 6, 6, 7, 7],
    [0, 0, 0, 0, 0, 6, 6, 7, 7],
  ],
  [
    [8, 8, 3, 3, 3, 3, 3, 2, 2],
    [8, 8, 5, 3, 3, 3, 3, 2, 2],
    [8, 8, 5, 5, 5, 5, 2, 2, 2],
    [8, 8, 5, 5, 5, 5, 2, 2, 1],
    [8, 7, 6, 4, 4, 4, 1, 1, 1],
    [7, 7, 6, 6, 4, 4, 1, 1, 1],
    [7, 7, 6, 6, 4, 4, 0, 1, 0],
    [7, 7, 6, 6, 4, 4, 0, 1, 0],
    [7, 7, 6, 6, 0, 0, 0, 0, 0],
  ],
];

function buildRowAndColumnHouses(): House[] {
  const rowHouses = range(JIGSAW_SIZE).map((row) => ({
    id: `row-${row}`,
    cells: range(JIGSAW_SIZE).map((col) => cellId(row, col)),
  }));
  const columnHouses = range(JIGSAW_SIZE).map((col) => ({
    id: `col-${col}`,
    cells: range(JIGSAW_SIZE).map((row) => cellId(row, col)),
  }));

  return [...rowHouses, ...columnHouses];
}

function buildRegionHouses(regions: number[][]): House[] {
  const buckets = new Map<number, string[]>();

  for (let row = 0; row < JIGSAW_SIZE; row += 1) {
    for (let col = 0; col < JIGSAW_SIZE; col += 1) {
      const region = regions[row]?.[col];

      if (region === undefined) {
        continue;
      }

      const cells = buckets.get(region) ?? [];
      cells.push(cellId(row, col));
      buckets.set(region, cells);
    }
  }

  return [...buckets.entries()]
    .sort(([left], [right]) => left - right)
    .map(([region, cells]) => ({ id: `region-${region}`, cells }));
}

export function isJigsawStructure(structure: unknown): structure is JigsawStructure {
  return (
    typeof structure === 'object' &&
    structure !== null &&
    Array.isArray((structure as JigsawStructure).regions)
  );
}

export function makeJigsawVariant(regions: number[][]): Variant {
  return {
    id: 'jigsaw',
    name: 'Jigsaw Sudoku',
    description:
      'Nine irregular, interlocking regions replace the standard 3×3 boxes. Same rules, new shapes.',
    help: [
      {
        label: 'Basic Rules',
        tone: 'basic',
        rules: [
          {
            term: 'The board',
            text: 'A 9×9 board where the nine regions are irregular jigsaw shapes instead of standard 3×3 boxes.',
          },
          {
            term: 'Rows and columns',
            text: 'Every row and every column must contain each symbol exactly once.',
          },
          {
            term: 'Regions',
            text: 'Each of the nine regions must also hold every symbol exactly once.',
          },
        ],
      },
      {
        label: 'Additional Rules',
        tone: 'extra',
        rules: [
          {
            term: 'Region shapes',
            text: 'Each region contains exactly 9 cells but can be any shape. Region boundaries are marked by thick borders.',
          },
        ],
      },
    ],
    popularity: 5,
    difficulty: 'intermediate',
    difficultyRank: 10,
    layout: { kind: 'grid', size: JIGSAW_SIZE, box: { rows: 3, cols: 3 } },
    symbols: [1, 2, 3, 4, 5, 6, 7, 8, 9],
    constraintIds: ['uniqueness'],
    buildHouses(_layout: BoardLayout) {
      return [...buildRowAndColumnHouses(), ...buildRegionHouses(regions)];
    },
    overlayIds: ['jigsaw'],
    annotatorIds: ['jigsaw'],
    deriveStructure: () => ({ regions }),
  };
}

// Matches the original jigsaw generator: blank a fixed number of cells from the
// solved grid in a single pass, with no per-removal uniqueness search. Proving
// uniqueness on irregular regions is expensive and heavy-tailed, which froze the
// page; the original never verified uniqueness and so never paid that cost.
const JIGSAW_GIVEN_COUNT = 31;

function generateJigsawGivens(
  solution: Solution,
  _model: VariantModel,
  _difficulty: Difficulty,
  rng: (() => number) | undefined = Math.random
): Values {
  const safeRng = rng ?? Math.random;
  const givens: Values = new Map(solution);

  for (const id of shuffle([...givens.keys()], safeRng)) {
    if (givens.size <= JIGSAW_GIVEN_COUNT) {
      break;
    }

    givens.delete(id);
  }

  return givens;
}

export function makePlayableJigsawVariant(regions: number[][]): Variant {
  return {
    ...makeJigsawVariant(regions),
    generateGivens: generateJigsawGivens,
  };
}

export const jigsaw: Variant = makePlayableJigsawVariant(PRESET_LAYOUTS[0]);

// --- Random region generation ---
// Start from the standard 3×3 boxes and scramble with boundary-pair swaps:
// a cell of region A on the border with region B trades places with a cell
// of B on the border with A (the two cells need not be adjacent to each
// other). Region sizes stay at nine by construction; connectivity is
// re-checked after every swap and broken swaps are reverted. A scrambled
// partition is only returned once a bounded solve proves it admits at least
// one valid filling — a partition with no filling would send puzzle
// generation into its restart tail.

const REGION_SWAP_TARGET = 150;
const REGION_SWAP_MAX_TRIES = 4000;
// Below this many accepted swaps the board still reads as slightly bent
// boxes; scrap the attempt and rescramble instead of shipping it.
const REGION_MIN_SWAPS = 40;
const REGION_ATTEMPTS = 20;
// Kept small on purpose: fillable partitions almost always solve within a
// few thousand propagation nodes, while every rejected partition burns the
// FULL budget × restarts before rescrambling. A generous budget here turned
// unlucky seeds into ~1s synchronous stalls; treating a budget-abort as
// "just scramble again" is far cheaper than proving a hard partition.
const REGION_FILL_NODE_BUDGET = 4_000;
const REGION_FILL_RESTARTS = 2;

const DIRECTIONS: [number, number][] = [
  [-1, 0],
  [1, 0],
  [0, -1],
  [0, 1],
];

function isRegionConnected(regions: number[][], region: number): boolean {
  const cells: [number, number][] = [];

  for (let row = 0; row < JIGSAW_SIZE; row += 1) {
    for (let col = 0; col < JIGSAW_SIZE; col += 1) {
      if (regions[row][col] === region) {
        cells.push([row, col]);
      }
    }
  }

  if (cells.length === 0) {
    return false;
  }

  const key = (row: number, col: number) => row * JIGSAW_SIZE + col;
  const inRegion = new Set(cells.map(([row, col]) => key(row, col)));
  const seen = new Set([key(cells[0][0], cells[0][1])]);
  const queue: [number, number][] = [cells[0]];

  while (queue.length > 0) {
    const [row, col] = queue.pop()!;
    const neighbors: [number, number][] = [
      [row - 1, col],
      [row + 1, col],
      [row, col - 1],
      [row, col + 1],
    ];

    for (const [nextRow, nextCol] of neighbors) {
      if (nextRow < 0 || nextRow >= JIGSAW_SIZE || nextCol < 0 || nextCol >= JIGSAW_SIZE) {
        continue;
      }

      const nextKey = key(nextRow, nextCol);
      if (inRegion.has(nextKey) && !seen.has(nextKey)) {
        seen.add(nextKey);
        queue.push([nextRow, nextCol]);
      }
    }
  }

  return seen.size === cells.length;
}

function bordersRegion(regions: number[][], row: number, col: number, region: number): boolean {
  return DIRECTIONS.some(([deltaRow, deltaCol]) => {
    const nextRow = row + deltaRow;
    const nextCol = col + deltaCol;

    return (
      nextRow >= 0 &&
      nextRow < JIGSAW_SIZE &&
      nextCol >= 0 &&
      nextCol < JIGSAW_SIZE &&
      regions[nextRow][nextCol] === region
    );
  });
}

function scrambleRegions(rng: () => number): number[][] | null {
  const regions = range(JIGSAW_SIZE).map((row) =>
    range(JIGSAW_SIZE).map((col) => Math.floor(row / 3) * 3 + Math.floor(col / 3))
  );
  let swaps = 0;

  for (let tries = 0; tries < REGION_SWAP_MAX_TRIES && swaps < REGION_SWAP_TARGET; tries += 1) {
    const rowA = Math.floor(rng() * JIGSAW_SIZE);
    const colA = Math.floor(rng() * JIGSAW_SIZE);
    const [deltaRow, deltaCol] = DIRECTIONS[Math.floor(rng() * DIRECTIONS.length)];
    const neighborRow = rowA + deltaRow;
    const neighborCol = colA + deltaCol;

    if (
      neighborRow < 0 ||
      neighborRow >= JIGSAW_SIZE ||
      neighborCol < 0 ||
      neighborCol >= JIGSAW_SIZE
    ) {
      continue;
    }

    const a = regions[rowA][colA];
    const b = regions[neighborRow][neighborCol];

    if (a === b) {
      continue;
    }

    const candidates: [number, number][] = [];
    for (let row = 0; row < JIGSAW_SIZE; row += 1) {
      for (let col = 0; col < JIGSAW_SIZE; col += 1) {
        if (regions[row][col] === b && bordersRegion(regions, row, col, a)) {
          candidates.push([row, col]);
        }
      }
    }

    if (candidates.length === 0) {
      continue;
    }

    const [rowB, colB] = candidates[Math.floor(rng() * candidates.length)];
    regions[rowA][colA] = b;
    regions[rowB][colB] = a;

    if (isRegionConnected(regions, a) && isRegionConnected(regions, b)) {
      swaps += 1;
    } else {
      regions[rowA][colA] = a;
      regions[rowB][colB] = b;
    }
  }

  return swaps >= REGION_MIN_SWAPS ? regions : null;
}

function admitsFilling(regions: number[][], rng: () => number): boolean {
  const model = buildModel(makeJigsawVariant(regions));

  for (let attempt = 0; attempt < REGION_FILL_RESTARTS; attempt += 1) {
    if (findSolution(model, new Map(), { rng, nodeBudget: REGION_FILL_NODE_BUDGET })) {
      return true;
    }
  }

  return false;
}

export function generateJigsawRegions(rng: () => number): number[][] {
  for (let attempt = 0; attempt < REGION_ATTEMPTS; attempt += 1) {
    const regions = scrambleRegions(rng);

    if (regions && admitsFilling(regions, rng)) {
      return regions;
    }
  }

  // Practically unreachable — scrambled partitions almost always admit a
  // filling — but a known-good preset keeps generation total either way.
  return PRESET_LAYOUTS[0];
}
