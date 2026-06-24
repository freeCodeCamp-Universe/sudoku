import { cellId, range, shuffle } from '@/engine/grid';
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
            term: 'The grid',
            text: 'A 9×9 board where the nine regions are irregular jigsaw shapes instead of standard 3×3 boxes.',
          },
          { term: 'Fill with 1–9', text: 'Every cell must contain a digit from 1 to 9.' },
          {
            term: 'No repeats',
            text: 'Each row, column, and jigsaw region must hold every digit exactly once.',
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
          {
            term: 'Given digits',
            text: 'Pre-filled cells are fixed. Fill in the rest to complete the puzzle.',
          },
          {
            term: 'Candidate mode',
            text: 'Candidates are small numbers you pencil into a cell to track which values are possible there.',
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
