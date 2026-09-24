import type { CellId } from '@/engine/types';

const LESSON_CELL_ID_PATTERN = /^r([1-9]\d*)c([1-9]\d*)$/;
const ENGINE_CELL_ID_PATTERN = /^r(0|[1-9]\d*)c(0|[1-9]\d*)$/;

export function lessonCellIdToCellId(id: string): CellId {
  const match = LESSON_CELL_ID_PATTERN.exec(id);
  if (!match) {
    throw new Error(`Invalid lesson cell id "${id}": expected 1-based format r1c1`);
  }

  const rowNumber = Number(match[1]);
  const colNumber = Number(match[2]);
  if (!Number.isSafeInteger(rowNumber) || !Number.isSafeInteger(colNumber)) {
    throw new Error(`Invalid lesson cell id "${id}": coordinates must be safe integers`);
  }
  const row = rowNumber - 1;
  const col = colNumber - 1;
  return `r${row}c${col}`;
}

export function cellIdToLessonCellId(id: CellId): string {
  const match = ENGINE_CELL_ID_PATTERN.exec(id);
  if (!match) {
    throw new Error(`Invalid engine cell id "${id}": expected 0-based format r0c0`);
  }

  const rowNumber = Number(match[1]);
  const colNumber = Number(match[2]);
  if (!Number.isSafeInteger(rowNumber) || !Number.isSafeInteger(colNumber)) {
    throw new Error(`Invalid engine cell id "${id}": coordinates must be safe integers`);
  }
  const row = rowNumber + 1;
  const col = colNumber + 1;
  return `r${row}c${col}`;
}
