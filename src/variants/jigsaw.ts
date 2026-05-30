import { cellId, range } from '@/engine/grid';
import type { BoardLayout, House, Variant } from '@/engine/types';

const JIGSAW_SIZE = 9;

export interface JigsawStructure {
  regions: number[][];
}

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
    [0, 0, 0, 0, 1, 1, 1, 1, 1],
    [0, 2, 2, 2, 2, 2, 2, 2, 1],
    [0, 3, 3, 3, 3, 3, 3, 2, 1],
    [0, 4, 4, 4, 4, 3, 3, 2, 1],
    [0, 5, 5, 5, 4, 4, 3, 6, 1],
    [0, 5, 5, 5, 4, 4, 4, 6, 6],
    [7, 5, 5, 5, 6, 6, 6, 6, 6],
    [7, 7, 7, 7, 8, 8, 8, 8, 6],
    [7, 7, 7, 7, 8, 8, 8, 8, 8],
  ],
  [
    [0, 0, 0, 1, 1, 1, 1, 2, 2],
    [0, 0, 1, 1, 1, 1, 1, 2, 2],
    [0, 3, 3, 3, 3, 3, 3, 2, 2],
    [0, 4, 4, 4, 4, 3, 3, 3, 2],
    [0, 4, 4, 4, 4, 4, 5, 5, 2],
    [0, 6, 6, 6, 6, 5, 5, 5, 2],
    [6, 6, 6, 6, 6, 5, 5, 5, 5],
    [7, 7, 7, 7, 7, 8, 8, 8, 8],
    [7, 7, 7, 7, 8, 8, 8, 8, 8],
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
  return typeof structure === 'object'
    && structure !== null
    && Array.isArray((structure as JigsawStructure).regions);
}

export function makeJigsawVariant(regions: number[][]): Variant {
  return {
    id: 'jigsaw',
    name: 'Jigsaw Sudoku',
    difficulty: 'intermediate',
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

export const jigsaw: Variant = makeJigsawVariant(PRESET_LAYOUTS[0]);
