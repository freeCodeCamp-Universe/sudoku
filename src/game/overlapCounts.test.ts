import { describe, expect, it } from 'vitest';
import { cellId } from '@/engine/grid';
import type { MultiGridLayout } from '@/engine/types';
import { overlapCounts } from './overlapCounts';

function multigrid(
  canvas: number,
  subGridSize: number,
  origins: [number, number][]
): MultiGridLayout {
  return {
    kind: 'multigrid',
    subGridSize,
    box: { rows: 3, cols: 3 },
    canvasRows: canvas,
    canvasCols: canvas,
    subGrids: origins.map(([originRow, originCol]) => ({ originRow, originCol })),
  };
}

describe('overlapCounts', () => {
  it('should mark only the shared 3x3 block in the twodoku shape', () => {
    // Two 9x9 grids offset by 6, overlapping in rows 6-8 x cols 6-8.
    const counts = overlapCounts(
      multigrid(15, 9, [
        [0, 0],
        [6, 6],
      ])
    );

    expect(counts.size).toBe(9);
    for (let row = 6; row <= 8; row += 1) {
      for (let col = 6; col <= 8; col += 1) {
        expect(counts.get(cellId(row, col))).toBe(2);
      }
    }
  });

  it('should count the four center overlaps in the samurai shape', () => {
    // Center grid shares a 3x3 block with each of the four corner grids; the
    // corners never overlap each other, so every overlap cell has count 2.
    const counts = overlapCounts(
      multigrid(21, 9, [
        [0, 0],
        [0, 12],
        [6, 6],
        [12, 0],
        [12, 12],
      ])
    );

    expect(counts.size).toBe(36);
    expect(counts.get(cellId(6, 6))).toBe(2); // top-left corner ∩ center
    expect(counts.get(cellId(8, 14))).toBe(2); // top-right corner ∩ center
    expect(new Set(counts.values())).toEqual(new Set([2]));
  });

  it('should exclude cells in one subgrid and cells in a gap', () => {
    const counts = overlapCounts(
      multigrid(15, 9, [
        [0, 0],
        [6, 6],
      ])
    );

    expect(counts.has(cellId(0, 0))).toBe(false); // only in the first grid
    expect(counts.has(cellId(0, 14))).toBe(false); // in no grid
  });

  it('should count higher overlaps and cap the densest stack at five', () => {
    const origin: [number, number] = [0, 0];
    const stack = (n: number) => overlapCounts(multigrid(1, 1, Array(n).fill(origin)));

    expect(stack(3).get(cellId(0, 0))).toBe(3);
    expect(stack(4).get(cellId(0, 0))).toBe(4);
    expect(stack(5).get(cellId(0, 0))).toBe(5);
    expect(stack(7).get(cellId(0, 0))).toBe(5); // no layout is this dense; shares the top rung
  });
});
