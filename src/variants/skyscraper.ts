import { range } from '@/engine/grid';
import type { Solution, Variant, VariantModel } from '@/engine/types';
import type { EdgeClues, GutterSlots } from '@/game/gameTypes';
import { generateGivens9x9 } from './generateGivens9x9';

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

function describeClue(value: number, place: string): string {
  return `${value} building${value === 1 ? '' : 's'} visible from ${place}`;
}

export function buildGutters(clues: EdgeClues): GutterSlots {
  return {
    top: clues.top.map((value, index) => ({
      id: `sky-top-${index}`,
      col: index,
      label: String(value),
      description: describeClue(value, `the top of column ${index + 1}`),
    })),
    bottom: clues.bottom.map((value, index) => ({
      id: `sky-bottom-${index}`,
      col: index,
      label: String(value),
      description: describeClue(value, `the bottom of column ${index + 1}`),
    })),
    start: clues.start.map((value, index) => ({
      id: `sky-start-${index}`,
      row: index,
      label: String(value),
      description: describeClue(value, `the start of row ${index + 1}`),
    })),
    end: clues.end.map((value, index) => ({
      id: `sky-end-${index}`,
      row: index,
      label: String(value),
      description: describeClue(value, `the end of row ${index + 1}`),
    })),
  };
}

export const skyscraper: Variant = {
  id: 'skyscraper',
  name: 'Skyscraper Sudoku',
  description:
    'Clues around the edge tell you how many buildings are visible looking into each row or column.',
  help: [
    {
      label: 'Additional Rules',
      tone: 'extra',
      rules: [
        {
          term: 'Building heights',
          text: 'Each cell represents a building, with its symbol indicating a height from 1 (shortest) to 9 (tallest).',
        },
        {
          term: 'Clues',
          text: 'The numbers outside the edge tell you how many buildings are visible when looking into the row or column from that position.',
        },
        {
          term: 'Line of sight',
          text: "The first building is always visible. Moving inward, a building is visible only if it's taller than every building before it. Shorter buildings are hidden behind taller ones.",
        },
        {
          term: 'Reading clues',
          text: 'A clue of 1 means only one building is visible from that direction. A clue of 3 means three buildings are visible, and each visible building is taller than all buildings before it, not just its neighbor. The remaining buildings are hidden from view.',
        },
      ],
    },
  ],
  popularity: 11,
  generateGivens: generateGivens9x9,
  difficulty: 'advanced',
  difficultyRank: 2,
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
