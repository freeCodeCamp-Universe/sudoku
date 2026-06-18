import type { Cell, CellId, Conflict, Constraint, VariantModel } from '../types';

export interface Mark {
  a: CellId;
  b: CellId;
}

function getMarks(model: VariantModel): Mark[] | null {
  const structure = model.structure as { marks?: Mark[] } | undefined;

  if (!structure || !('marks' in structure)) {
    return null;
  }

  return structure.marks ?? [];
}

function cellLookup(cells: Cell[]): Map<CellId, Cell> {
  return new Map(cells.map((cell) => [cell.id, cell]));
}

function adjacencyPairs(cells: Cell[]): Array<[CellId, CellId]> {
  const byPosition = new Map(cells.map((cell) => [`${cell.row}:${cell.col}`, cell.id]));
  const pairs: Array<[CellId, CellId]> = [];

  for (const cell of cells) {
    const right = byPosition.get(`${cell.row}:${cell.col + 1}`);
    const down = byPosition.get(`${cell.row + 1}:${cell.col}`);

    if (right) {
      pairs.push([cell.id, right]);
    }

    if (down) {
      pairs.push([cell.id, down]);
    }
  }

  return pairs;
}

function neighborIds(cellId: CellId, cells: Cell[]): CellId[] {
  const byId = cellLookup(cells);
  const cell = byId.get(cellId);

  if (!cell) {
    return [];
  }

  const byPosition = new Map(cells.map((entry) => [`${entry.row}:${entry.col}`, entry.id]));

  return [
    byPosition.get(`${cell.row - 1}:${cell.col}`),
    byPosition.get(`${cell.row + 1}:${cell.col}`),
    byPosition.get(`${cell.row}:${cell.col - 1}`),
    byPosition.get(`${cell.row}:${cell.col + 1}`),
  ].filter((neighbor): neighbor is CellId => neighbor !== undefined);
}

function markedKey(a: CellId, b: CellId): string {
  return [a, b].sort().join('|');
}

function markSet(marks: Mark[]): Set<string> {
  return new Set(marks.map(({ a, b }) => markedKey(a, b)));
}

export const consecutive: Constraint = {
  id: 'consecutive',
  conflicts(values, model) {
    const marks = getMarks(model);

    if (marks === null) {
      return [];
    }

    const marked = markSet(marks);
    const conflicts: Conflict[] = [];

    for (const [a, b] of adjacencyPairs(model.cells)) {
      const aValue = values.get(a);
      const bValue = values.get(b);

      if (aValue === undefined || bValue === undefined) {
        continue;
      }

      const isConsecutive = Math.abs(aValue - bValue) === 1;
      const shouldBeConsecutive = marked.has(markedKey(a, b));

      if (isConsecutive !== shouldBeConsecutive) {
        conflicts.push({ cells: [a, b], constraintId: 'consecutive' });
      }
    }

    return conflicts;
  },
  permits(values, cellId, value, model) {
    const marks = getMarks(model);

    if (marks === null) {
      return true;
    }

    const marked = markSet(marks);

    for (const neighbor of neighborIds(cellId, model.cells)) {
      const neighborValue = values.get(neighbor);

      if (neighborValue === undefined) {
        continue;
      }

      const wouldBeConsecutive = Math.abs(value - neighborValue) === 1;
      const shouldBeConsecutive = marked.has(markedKey(cellId, neighbor));

      if (wouldBeConsecutive !== shouldBeConsecutive) {
        return false;
      }
    }

    return true;
  },
};
