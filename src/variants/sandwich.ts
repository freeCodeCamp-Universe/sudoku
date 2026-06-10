import { cellId, range } from '@/engine/grid';
import type { Solution, Variant } from '@/engine/types';
import type { GutterSlots } from '@/game/gameTypes';
import { generateGivens9x9 } from './generateGivens9x9';

interface SandwichClues {
  rows: number[];
  cols: number[];
}

function sumBetween(vals: number[]): number {
  const pos1 = vals.indexOf(1);
  const pos9 = vals.indexOf(9);
  if (pos1 === -1 || pos9 === -1) return 0;
  const lo = Math.min(pos1, pos9);
  const hi = Math.max(pos1, pos9);
  let sum = 0;
  for (let i = lo + 1; i < hi; i += 1) sum += vals[i];
  return sum;
}

export function computeSandwichClues(solution: Solution): SandwichClues {
  return {
    rows: range(9).map((r) =>
      sumBetween(range(9).map((c) => solution.get(cellId(r, c)) ?? 0))
    ),
    cols: range(9).map((c) =>
      sumBetween(range(9).map((r) => solution.get(cellId(r, c)) ?? 0))
    ),
  };
}

function buildGutters(clues: SandwichClues): GutterSlots {
  return {
    end: clues.rows.map((value, index) => ({
      id: `sw-end-${index}`,
      row: index,
      label: String(value),
      description: `Sum of digits between 1 and 9 in row ${index + 1} is ${value}`,
    })),
    bottom: clues.cols.map((value, index) => ({
      id: `sw-bottom-${index}`,
      col: index,
      label: String(value),
      description: `Sum of digits between 1 and 9 in column ${index + 1} is ${value}`,
    })),
  };
}

export const sandwich: Variant = {
  id: 'sandwich',
  name: 'Sandwich Sudoku',
  description: 'Standard sudoku where clues on the right and bottom give the sum of all digits sandwiched between the 1 and 9 in each row and column.',
  help: [
    {
      label: 'Basic Rules',
      tone: 'basic',
      rules: [
        { term: 'The grid', text: 'A standard 9×9 sudoku. Fill every row, column, and 3×3 box with digits 1-9.' },
        { term: 'Sandwich clues', text: 'Numbers on the right and bottom tell you the sum of all digits that sit between the 1 and the 9 in that row or column.' },
        { term: 'The bread', text: 'The 1 and 9 act as the two slices of bread. Every digit placed between them must add up to the clue.' },
      ],
    },
    {
      label: 'Additional Rules',
      tone: 'extra',
      rules: [
        { term: 'Zero is valid', text: 'A clue of 0 means the 1 and the 9 are adjacent with no digits between them.' },
        { term: 'Any order', text: 'The digits between the 1 and 9 can appear in any order, but they must sum to the clue.' },
      ],
    },
  ],
  popularity: 12,
  difficulty: 'advanced',
  layout: { kind: 'grid', size: 9, box: { rows: 3, cols: 3 } },
  symbols: [1, 2, 3, 4, 5, 6, 7, 8, 9],
  symbolKind: 'digit',
  constraintIds: ['uniqueness', 'sandwichSum'],
  overlayIds: [],
  annotatorIds: [],
  generateGivens: generateGivens9x9,
  deriveStructure(solution: Solution): SandwichClues {
    return computeSandwichClues(solution);
  },
  deriveGutters(structure: unknown): GutterSlots | undefined {
    const clues = structure as SandwichClues | undefined;
    return clues?.rows ? buildGutters(clues) : undefined;
  },
};
