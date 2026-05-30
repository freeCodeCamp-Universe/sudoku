import { range } from '@/engine/grid';
import type { Solution, Variant, VariantModel } from '@/engine/types';
import type { EdgeClues, GutterSlots } from '@/game/gameTypes';

function cellId(row: number, col: number): string {
  return `r${row}c${col}`;
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

function computeClues(solution: Solution): EdgeClues {
  const top: number[] = [];
  const bottom: number[] = [];
  const start: number[] = [];
  const end: number[] = [];

  for (const col of range(9)) {
    const values = range(9).map((row) => solution.get(cellId(row, col)) ?? 0);

    top.push(countVisible(values));
    bottom.push(countVisible([...values].reverse()));
  }

  for (const row of range(9)) {
    const values = range(9).map((col) => solution.get(cellId(row, col)) ?? 0);

    start.push(countVisible(values));
    end.push(countVisible([...values].reverse()));
  }

  return { top, bottom, start, end };
}

export function buildGutters(clues: EdgeClues): GutterSlots {
  return {
    top: clues.top.map((value, index) => ({
      id: `sky-top-${index}`,
      col: index,
      label: String(value),
    })),
    bottom: clues.bottom.map((value, index) => ({
      id: `sky-bottom-${index}`,
      col: index,
      label: String(value),
    })),
    start: clues.start.map((value, index) => ({
      id: `sky-start-${index}`,
      row: index,
      label: String(value),
    })),
    end: clues.end.map((value, index) => ({
      id: `sky-end-${index}`,
      row: index,
      label: String(value),
    })),
  };
}

export const skyscraper: Variant = {
  id: 'skyscraper',
  name: 'Skyscraper Sudoku',
  difficulty: 'advanced',
  layout: { kind: 'grid', size: 9, box: { rows: 3, cols: 3 } },
  symbols: [1, 2, 3, 4, 5, 6, 7, 8, 9],
  symbolKind: 'digit',
  constraintIds: ['uniqueness', 'skyscraperVisibility'],
  overlayIds: [],
  annotatorIds: ['skyscraper-clue'],
  deriveStructure(solution: Solution, _model: VariantModel): { clues: EdgeClues } {
    return { clues: computeClues(solution) };
  },
  deriveGutters(structure: unknown): GutterSlots | undefined {
    const clues = (structure as { clues?: EdgeClues } | undefined)?.clues;

    return clues ? buildGutters(clues) : undefined;
  },
};
