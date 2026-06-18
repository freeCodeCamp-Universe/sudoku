import type { CellId } from '@/engine/types';
import type { CellAnnotator } from '@/game/gameTypes';

export const wordokuAnnotator: CellAnnotator = {
  id: 'wordoku',
  describe(cellId, ctx) {
    const structure = ctx.model.structure as { word?: string } | undefined;
    if (!structure?.word) return null;

    const match = /^r(\d+)c(\d+)$/.exec(cellId);
    if (!match) return null;

    const row = parseInt(match[1], 10);
    const col = parseInt(match[2], 10);
    const value = ctx.values.get(cellId as CellId);
    if (value === undefined) return null;

    if (value === col + 1) {
      const rowSpellsWord = Array.from(
        { length: 9 },
        (_, c) => ctx.values.get(`r${row}c${c}` as CellId) === c + 1
      ).every(Boolean);
      if (rowSpellsWord) return 'word row';
    }

    if (value === row + 1) {
      const colSpellsWord = Array.from(
        { length: 9 },
        (_, r) => ctx.values.get(`r${r}c${col}` as CellId) === r + 1
      ).every(Boolean);
      if (colSpellsWord) return 'word column';
    }

    return null;
  },
};
