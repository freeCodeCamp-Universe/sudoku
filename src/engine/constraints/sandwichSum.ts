import type { CellId, Conflict, Constraint, SymbolValue, Values, VariantModel } from '../types';
import { cellId, range } from '../grid';

interface SandwichClues {
  rows: number[];
  cols: number[];
}

function getClues(model: VariantModel): SandwichClues | undefined {
  const s = model.structure as { rows?: number[] } | undefined;
  return s?.rows ? (model.structure as SandwichClues) : undefined;
}

function checkLine(
  values: Values,
  targetId: CellId,
  targetValue: SymbolValue,
  cells: CellId[],
  clue: number
): boolean {
  const line: (number | null)[] = cells.map((id) =>
    id === targetId ? targetValue : (values.get(id) ?? null)
  );

  let pos1 = -1;
  let pos9 = -1;
  for (let i = 0; i < line.length; i += 1) {
    if (line[i] === 1) pos1 = i;
    if (line[i] === 9) pos9 = i;
  }
  if (pos1 === -1 || pos9 === -1) return true;

  const lo = Math.min(pos1, pos9);
  const hi = Math.max(pos1, pos9);
  let placed = 0;
  let unplaced = 0;
  for (let i = lo + 1; i < hi; i += 1) {
    const v = line[i];
    if (v === null) unplaced += 1;
    else placed += v;
  }

  if (placed > clue) return false;
  if (unplaced === 0 && placed !== clue) return false;
  return true;
}

export const sandwichSum: Constraint = {
  id: 'sandwichSum',

  conflicts(values: Values, model: VariantModel): Conflict[] {
    const clues = getClues(model);
    if (!clues) return [];

    const result: Conflict[] = [];

    for (const row of range(9)) {
      const cells: CellId[] = range(9).map((col) => cellId(row, col));
      if (!cells.every((id) => values.has(id))) continue;
      const vals = cells.map((id) => values.get(id) ?? 0);
      const pos1 = vals.indexOf(1);
      const pos9 = vals.indexOf(9);
      if (pos1 === -1 || pos9 === -1) continue;
      const lo = Math.min(pos1, pos9);
      const hi = Math.max(pos1, pos9);
      let sum = 0;
      for (let i = lo + 1; i < hi; i += 1) sum += vals[i];
      if (sum !== clues.rows[row]) {
        result.push({ cells, constraintId: 'sandwichSum' });
      }
    }

    for (const col of range(9)) {
      const cells: CellId[] = range(9).map((row) => cellId(row, col));
      if (!cells.every((id) => values.has(id))) continue;
      const vals = cells.map((id) => values.get(id) ?? 0);
      const pos1 = vals.indexOf(1);
      const pos9 = vals.indexOf(9);
      if (pos1 === -1 || pos9 === -1) continue;
      const lo = Math.min(pos1, pos9);
      const hi = Math.max(pos1, pos9);
      let sum = 0;
      for (let i = lo + 1; i < hi; i += 1) sum += vals[i];
      if (sum !== clues.cols[col]) {
        result.push({ cells, constraintId: 'sandwichSum' });
      }
    }

    return result;
  },

  permits(values: Values, id: CellId, value: SymbolValue, model: VariantModel): boolean {
    const clues = getClues(model);
    if (!clues) return true;

    const match = /^r(\d+)c(\d+)$/.exec(id);
    if (!match) return true;
    const r = parseInt(match[1], 10);
    const c = parseInt(match[2], 10);

    return (
      checkLine(
        values,
        id,
        value,
        range(9).map((col) => cellId(r, col)),
        clues.rows[r]
      ) &&
      checkLine(
        values,
        id,
        value,
        range(9).map((row) => cellId(row, c)),
        clues.cols[c]
      )
    );
  },
};
