import { cellId, range, shuffle } from '@/engine/grid';
import type { Solution, Variant, VariantModel } from '@/engine/types';
import { makeGenerateGivens } from './generateGivens9x9';
import type { Cage } from '@/game/gameTypes';

const N = 9;
const MAX_CARVE_ATTEMPTS = 300;

function neighbors(r: number, c: number): [number, number][] {
  return (
    [
      [-1, 0],
      [1, 0],
      [0, -1],
      [0, 1],
    ] as [number, number][]
  )
    .map(([dr, dc]): [number, number] => [r + dr, c + dc])
    .filter(([nr, nc]) => nr >= 0 && nr < N && nc >= 0 && nc < N);
}

function parseCell(id: string): [number, number] | null {
  const match = /^r(\d+)c(\d+)$/.exec(id);
  if (!match) {
    return null;
  }

  return [Number(match[1]), Number(match[2])];
}

function computeCageSum(cage: Cage, solution: Solution): number {
  return cage.cells.reduce((total, id) => total + (solution.get(id) ?? 0), 0);
}

function cageHasUniqueDigits(cage: Cage, solution: Solution): boolean {
  const seen = new Set<number>();

  for (const id of cage.cells) {
    const value = solution.get(id);
    if (value === undefined) {
      continue;
    }
    if (seen.has(value)) {
      return false;
    }
    seen.add(value);
  }

  return true;
}

function carveCagesOnce(solution: Solution): Cage[] {
  const assigned = new Set<string>();
  const cages: Cage[] = [];
  const order = shuffle(range(N * N));

  for (const idx of order) {
    const startR = Math.floor(idx / N);
    const startC = idx % N;
    const startId = cellId(startR, startC);

    if (assigned.has(startId)) continue;

    const size = Math.random() < 0.3 ? 2 : Math.random() < 0.6 ? 3 : 4;
    const cells: string[] = [startId];
    assigned.add(startId);

    while (cells.length < Math.min(size, 4)) {
      const candidates: string[] = [];

      for (const id of cells) {
        const parsed = parseCell(id);
        if (!parsed) continue;
        const [r, c] = parsed;

        for (const [nr, nc] of neighbors(r, c)) {
          const nid = cellId(nr, nc);
          if (!assigned.has(nid)) candidates.push(nid);
        }
      }

      if (candidates.length === 0) break;
      const pick = candidates[Math.floor(Math.random() * candidates.length)];
      cells.push(pick);
      assigned.add(pick);
    }

    cages.push({ cells, sum: cells.reduce((total, id) => total + (solution.get(id) ?? 0), 0) });
  }

  return cages;
}

function mergeOrphans(cages: Cage[], solution: Solution): Cage[] {
  const nextCages = cages.map((cage) => ({ ...cage, cells: [...cage.cells] }));
  const cellToCage = new Map<string, number>();
  const removed = new Set<number>();

  nextCages.forEach((cage, cageIndex) => {
    for (const id of cage.cells) {
      cellToCage.set(id, cageIndex);
    }
  });

  const orphanCells = nextCages
    .filter((cage) => cage.cells.length === 1)
    .map((cage) => cage.cells[0]);

  for (const orphanId of orphanCells) {
    const orphanIndex = cellToCage.get(orphanId);

    if (orphanIndex === undefined || removed.has(orphanIndex)) continue;
    if (nextCages[orphanIndex].cells.length !== 1) continue;

    const parsed = parseCell(orphanId);
    if (!parsed) continue;
    const [r, c] = parsed;
    const adjacentIndices = new Set<number>();
    const orphanValue = solution.get(orphanId);

    for (const [nr, nc] of neighbors(r, c)) {
      const neighborId = cellId(nr, nc);
      const neighborIndex = cellToCage.get(neighborId);

      if (
        neighborIndex !== undefined &&
        neighborIndex !== orphanIndex &&
        !removed.has(neighborIndex)
      ) {
        const targetCage = nextCages[neighborIndex];
        const hasDuplicate =
          orphanValue !== undefined &&
          targetCage.cells.some((cell) => solution.get(cell) === orphanValue);
        if (!hasDuplicate) {
          adjacentIndices.add(neighborIndex);
        }
      }
    }

    if (adjacentIndices.size === 0) continue;

    const targetIndex = [...adjacentIndices].sort((a, b) => {
      const sizeDelta = nextCages[a].cells.length - nextCages[b].cells.length;
      return sizeDelta !== 0 ? sizeDelta : a - b;
    })[0];
    nextCages[targetIndex].cells.push(orphanId);
    nextCages[targetIndex].sum = computeCageSum(nextCages[targetIndex], solution);

    nextCages[orphanIndex].cells = [];
    nextCages[orphanIndex].sum = 0;
    removed.add(orphanIndex);
    cellToCage.set(orphanId, targetIndex);
  }

  return nextCages
    .filter((_, cageIndex) => !removed.has(cageIndex))
    .map((cage) => ({
      ...cage,
      sum: computeCageSum(cage, solution),
    }));
}

function allCagesWithinSizeRange(cages: Cage[]): boolean {
  return cages.every((cage) => cage.cells.length >= 2 && cage.cells.length <= 4);
}

function allCagesHaveUniqueDigits(cages: Cage[], solution: Solution): boolean {
  return cages.every((cage) => cageHasUniqueDigits(cage, solution));
}

function carveCages(solution: Solution, _model: VariantModel): { cages: Cage[] } {
  let fallback: Cage[] | null = null;

  for (let attempt = 0; attempt < MAX_CARVE_ATTEMPTS; attempt += 1) {
    const merged = mergeOrphans(carveCagesOnce(solution), solution);
    if (!fallback) {
      fallback = merged;
    }
    if (allCagesWithinSizeRange(merged) && allCagesHaveUniqueDigits(merged, solution)) {
      return { cages: merged };
    }
  }

  return { cages: fallback ?? mergeOrphans(carveCagesOnce(solution), solution) };
}

export const killer: Variant = {
  id: 'killer',
  name: 'Killer Sudoku',
  description:
    'Cells are grouped into cages, each with a target sum. No digit may repeat within a cage.',
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
          term: 'Cages',
          text: 'Cells are grouped into dashed cages, each with a small target number in its corner.',
        },
        {
          term: 'Sum rule',
          text: 'The digits inside each dashed cage must add up to that target exactly.',
        },
      ],
    },
    {
      label: 'Additional Rules',
      tone: 'extra',
      rules: [
        {
          term: 'No repeats in cages',
          text: 'A digit may not appear twice within the same cage, even if sudoku rules would otherwise allow it.',
        },
        {
          term: 'Starting clues',
          text: 'A few cells are pre-filled to help you get started. The cage sums provide the rest of the constraints.',
        },
      ],
    },
  ],
  popularity: 2,
  difficulty: 'intermediate',
  difficultyRank: 11,
  layout: { kind: 'grid', size: 9, box: { rows: 3, cols: 3 } },
  symbols: [1, 2, 3, 4, 5, 6, 7, 8, 9],
  symbolKind: 'digit',
  constraintIds: ['uniqueness', 'cageSum'],
  overlayIds: ['cage'],
  annotatorIds: ['cage-sum'],
  deriveStructure: carveCages,
  generateGivens: makeGenerateGivens(15),
};
