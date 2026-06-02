import type { CellId } from '@/engine/types';

/**
 * Returns a human-readable description of the relationship from one cell to another.
 */
export function neighborDescription(fromId: CellId, toId: CellId): string {
  const cellRegex = /^r(\d+)c(\d+)$/;
  const fromMatch = cellRegex.exec(fromId);
  const toMatch = cellRegex.exec(toId);

  if (!fromMatch || !toMatch) {
    return 'a neighboring cell';
  }

  const fromRow = Number.parseInt(fromMatch[1], 10);
  const fromCol = Number.parseInt(fromMatch[2], 10);
  const toRow = Number.parseInt(toMatch[1], 10);
  const toCol = Number.parseInt(toMatch[2], 10);

  const dRow = toRow - fromRow;
  const dCol = toCol - fromCol;

  if (dRow === 0 && dCol === 1) {
    return 'the cell to the right';
  }
  if (dRow === 0 && dCol === -1) {
    return 'the cell to the left';
  }
  if (dRow === 1 && dCol === 0) {
    return 'the cell below';
  }
  if (dRow === -1 && dCol === 0) {
    return 'the cell above';
  }

  return 'a neighboring cell';
}
