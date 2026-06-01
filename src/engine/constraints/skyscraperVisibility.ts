import type { EdgeClues } from '@/game/gameTypes';
import { cellId, range } from '../grid';
import type { CellId, Conflict, Constraint, Values, VariantModel } from '../types';

function getClues(model: VariantModel): EdgeClues | undefined {
  return (model.structure as { clues?: EdgeClues } | undefined)?.clues;
}

function countVisible(values: number[]): number {
  let count = 0;
  let maxHeight = 0;

  for (const value of values) {
    if (value > maxHeight) {
      count += 1;
      maxHeight = value;
    }
  }

  return count;
}

export const skyscraperVisibility: Constraint = {
  id: 'skyscraperVisibility',

  conflicts(values: Values, model: VariantModel): Conflict[] {
    const clues = getClues(model);
    if (!clues) {
      return [];
    }

    const conflicts: Conflict[] = [];

    for (const row of range(9)) {
      const rowCells: CellId[] = range(9).map((col) => cellId(row, col));
      if (!rowCells.every((id) => values.has(id))) {
        continue;
      }

      const rowValues = rowCells.map((id) => values.get(id) ?? 0);
      if (clues.start[row] > 0 && countVisible(rowValues) !== clues.start[row]) {
        conflicts.push({ cells: rowCells, constraintId: 'skyscraperVisibility' });
      }
      if (clues.end[row] > 0 && countVisible([...rowValues].reverse()) !== clues.end[row]) {
        conflicts.push({ cells: rowCells, constraintId: 'skyscraperVisibility' });
      }
    }

    for (const col of range(9)) {
      const colCells: CellId[] = range(9).map((row) => cellId(row, col));
      if (!colCells.every((id) => values.has(id))) {
        continue;
      }

      const colValues = colCells.map((id) => values.get(id) ?? 0);
      if (clues.top[col] > 0 && countVisible(colValues) !== clues.top[col]) {
        conflicts.push({ cells: colCells, constraintId: 'skyscraperVisibility' });
      }
      if (clues.bottom[col] > 0 && countVisible([...colValues].reverse()) !== clues.bottom[col]) {
        conflicts.push({ cells: colCells, constraintId: 'skyscraperVisibility' });
      }
    }

    return conflicts;
  },
};
