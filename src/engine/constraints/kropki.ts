import type { Cell, CellId, Conflict, Constraint, VariantModel } from '../types';

export interface KropkiMark {
  a: CellId;
  b: CellId;
  kind: 'white' | 'black';
}

function getMarks(model: VariantModel): KropkiMark[] | null {
  const structure = model.structure as { kropkiMarks?: KropkiMark[] } | undefined;

  if (!structure || !('kropkiMarks' in structure)) {
    return null;
  }

  return structure.kropkiMarks ?? [];
}

function pairKey(a: CellId, b: CellId): string {
  return [a, b].sort().join('|');
}

function markMap(marks: KropkiMark[]): Map<string, 'white' | 'black'> {
  return new Map(marks.map((m) => [pairKey(m.a, m.b), m.kind]));
}

function adjacencyPairs(cells: Cell[]): Array<[CellId, CellId]> {
  const byPosition = new Map(cells.map((cell) => [`${cell.row}:${cell.col}`, cell.id]));
  const pairs: Array<[CellId, CellId]> = [];

  for (const cell of cells) {
    const right = byPosition.get(`${cell.row}:${cell.col + 1}`);
    const down = byPosition.get(`${cell.row + 1}:${cell.col}`);

    if (right) pairs.push([cell.id, right]);
    if (down) pairs.push([cell.id, down]);
  }

  return pairs;
}

function neighborIds(cellId: CellId, cells: Cell[]): CellId[] {
  const byId = new Map(cells.map((c) => [c.id, c]));
  const cell = byId.get(cellId);

  if (!cell) return [];

  const byPosition = new Map(cells.map((c) => [`${c.row}:${c.col}`, c.id]));

  return [
    byPosition.get(`${cell.row - 1}:${cell.col}`),
    byPosition.get(`${cell.row + 1}:${cell.col}`),
    byPosition.get(`${cell.row}:${cell.col - 1}`),
    byPosition.get(`${cell.row}:${cell.col + 1}`),
  ].filter((id): id is CellId => id !== undefined);
}

function isDouble(a: number, b: number): boolean {
  return a === 2 * b || b === 2 * a;
}

function isConsecutive(a: number, b: number): boolean {
  return Math.abs(a - b) === 1;
}

export const kropki: Constraint = {
  id: 'kropki',

  conflicts(values, model) {
    const marks = getMarks(model);

    if (marks === null) return [];

    const dots = markMap(marks);
    const conflicts: Conflict[] = [];

    for (const [a, b] of adjacencyPairs(model.cells)) {
      const va = values.get(a);
      const vb = values.get(b);

      if (va === undefined || vb === undefined) continue;

      const dotKind = dots.get(pairKey(a, b));
      const consecutive = isConsecutive(va, vb);
      const dbl = isDouble(va, vb);

      let conflict = false;

      if (dotKind === 'black') conflict = !dbl;
      else if (dotKind === 'white') conflict = !consecutive;
      else conflict = consecutive || dbl;

      if (conflict) {
        conflicts.push({ cells: [a, b], constraintId: 'kropki' });
      }
    }

    return conflicts;
  },

  permits(values, cellId, value, model) {
    const marks = getMarks(model);

    if (marks === null) return true;

    const dots = markMap(marks);

    for (const neighbor of neighborIds(cellId, model.cells)) {
      const neighborValue = values.get(neighbor);

      if (neighborValue === undefined) continue;

      const dotKind = dots.get(pairKey(cellId, neighbor));
      const consecutive = isConsecutive(value, neighborValue);
      const dbl = isDouble(value, neighborValue);

      if (dotKind === 'black' && !dbl) return false;
      if (dotKind === 'white' && !consecutive) return false;
      if (dotKind === undefined && (consecutive || dbl)) return false;
    }

    return true;
  },
};
