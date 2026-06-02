import { cellId, range, shuffle } from '@/engine/grid';
import type { Solution, Values, Variant, VariantModel } from '@/engine/types';
import type { Cage } from '@/game/gameTypes';

const N = 9;

function neighbours(r: number, c: number): [number, number][] {
  return ([[-1,0],[1,0],[0,-1],[0,1]] as [number,number][])
    .map(([dr,dc]): [number,number] => [r+dr, c+dc])
    .filter(([nr,nc]) => nr >= 0 && nr < N && nc >= 0 && nc < N);
}

function carveCages(solution: Solution, _model: VariantModel): { cages: Cage[] } {
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

    while (cells.length < size) {
      const candidates: string[] = [];

      for (const id of cells) {
        const m = /^r(\d+)c(\d+)$/.exec(id);
        if (!m) continue;
        const r = Number(m[1]);
        const c = Number(m[2]);
        for (const [nr, nc] of neighbours(r, c)) {
          const nid = cellId(nr, nc);
          if (!assigned.has(nid)) candidates.push(nid);
        }
      }

      if (candidates.length === 0) break;
      const pick = candidates[Math.floor(Math.random() * candidates.length)];
      cells.push(pick);
      assigned.add(pick);
    }

    const sum = cells.reduce((total, id) => total + (solution.get(id) ?? 0), 0);
    cages.push({ cells, sum });
  }

  return { cages };
}

export const killer: Variant = {
  id: 'killer',
  name: 'Killer Sudoku',
  description: 'Cells are grouped into dashed cages with target sums. Digits in each cage must add up to the total without repeating.',
  help: [
    {
      label: 'Basic Rules',
      tone: 'basic',
      rules: [
        { term: 'The grid', text: 'A standard 9×9 sudoku. Fill every row, column, and 3×3 box with digits 1–9.' },
        { term: 'Cages', text: 'Cells are grouped into dashed cages, each with a small target number in its corner.' },
        { term: 'Sum rule', text: 'The digits inside each dashed cage must add up to that target exactly.' },
      ],
    },
    {
      label: 'Additional Rules',
      tone: 'extra',
      rules: [
        { term: 'No repeats in cages', text: 'A digit may not appear twice within the same cage, even if sudoku rules would otherwise allow it.' },
        { term: 'Starting clues', text: 'A few cells are pre-filled to help you get started. The cage sums provide the rest of the constraints.' },
      ],
    },
  ],
  popularity: 2,
  difficulty: 'advanced',
  layout: { kind: 'grid', size: 9, box: { rows: 3, cols: 3 } },
  symbols: [1, 2, 3, 4, 5, 6, 7, 8, 9],
  symbolKind: 'digit',
  constraintIds: ['uniqueness', 'cageSum'],
  overlayIds: ['cage'],
  annotatorIds: ['cage-sum'],
  deriveStructure: carveCages,
  generateGivens(solution: Solution, _model: VariantModel, _difficulty: string, rng = Math.random): Values {
    const givens: Values = new Map();
    const N = 9;

    for (let r = 0; r < N; r++) {
      const cols = shuffle(range(N), rng);
      const count = rng() < 0.5 ? 2 : 1;

      for (let i = 0; i < count && givens.size < 16; i++) {
        const id = cellId(r, cols[i]);
        const val = solution.get(id);

        if (val !== undefined) {
          givens.set(id, val);
        }
      }
    }

    return givens;
  },
};
