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
  description: 'Clues around the edge tell you how many buildings are visible looking into each row or column.',
  help: [
    {
      label: 'Basic Rules',
      tone: 'basic',
      rules: [
        { term: 'The grid', text: 'A standard 9×9 sudoku. Fill every row, column, and 3×3 box with digits 1–9.' },
        { term: 'Building heights', text: 'Think of each digit as a building, where 1 is the shortest and 9 is the tallest.' },
        { term: 'Clues', text: 'Numbers around the edge tell you how many buildings are visible looking into that row or column. A taller building hides all shorter ones behind it.' },
      ],
    },
    {
      label: 'Additional Rules',
      tone: 'extra',
      rules: [
        { term: 'Reading clues', text: 'A clue of 1 means only the tallest building is visible. A clue of 9 means all nine buildings stand in perfect ascending order from that side.' },
        { term: 'Line of sight', text: 'Visibility is strictly from the clue\'s edge inward. Buildings behind a taller one are completely hidden.' },
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
