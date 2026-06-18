import type { Arrow } from '@/game/gameTypes';
import type { Solution, Variant, VariantModel } from '@/engine/types';
import { generateGivens9x9 } from './generateGivens9x9';

const DIRECTIONS: Array<readonly [number, number]> = [
  [0, 1],
  [1, 0],
  [0, -1],
  [-1, 0],
  [1, 1],
  [1, -1],
  [-1, 1],
  [-1, -1],
];

function cellId(row: number, col: number): string {
  return `r${row}c${col}`;
}

function carveArrows(solution: Solution, _model: VariantModel): { arrows: Arrow[] } {
  const candidates: Arrow[] = [];

  for (let row = 0; row < 9; row += 1) {
    for (let col = 0; col < 9; col += 1) {
      const bulb = cellId(row, col);
      const bulbValue = solution.get(bulb);

      if (bulbValue === undefined) {
        continue;
      }

      for (const [deltaRow, deltaCol] of DIRECTIONS) {
        for (let length = 2; length <= 3; length += 1) {
          const path: string[] = [];

          for (let step = 1; step <= length; step += 1) {
            const nextRow = row + deltaRow * step;
            const nextCol = col + deltaCol * step;

            if (nextRow < 0 || nextRow >= 9 || nextCol < 0 || nextCol >= 9) {
              path.length = 0;
              break;
            }

            path.push(cellId(nextRow, nextCol));
          }

          if (path.length !== length) {
            continue;
          }

          const pathSum = path.reduce((sum, entry) => sum + (solution.get(entry) ?? 0), 0);
          if (pathSum === bulbValue) {
            candidates.push({ bulb, path });
          }
        }
      }
    }
  }

  const used = new Set<string>();
  const arrows: Arrow[] = [];

  for (const candidate of candidates) {
    const candidateCells = [candidate.bulb, ...candidate.path];
    if (candidateCells.some((entry) => used.has(entry))) {
      continue;
    }

    arrows.push(candidate);
    candidateCells.forEach((entry) => used.add(entry));

    if (arrows.length === 9) {
      break;
    }
  }

  return { arrows };
}

export const arrow: Variant = {
  id: 'arrow',
  name: 'Arrow Sudoku',
  description:
    'Digits along each arrow sum to the number shown in the circle at the base of that arrow.',
  help: [
    {
      label: 'Basic Rules',
      tone: 'basic',
      rules: [
        {
          term: 'The grid',
          text: 'A standard 9×9 sudoku. Fill every row, column, and 3×3 box with digits 1–9.',
        },
        {
          term: 'Arrows',
          text: 'Each arrow has a circled bulb at its base and a line passing through one or more cells.',
        },
        {
          term: 'Sum rule',
          text: "The digit in the bulb must equal the sum of all digits along the arrow's line.",
        },
      ],
    },
    {
      label: 'Additional Rules',
      tone: 'extra',
      rules: [
        {
          term: 'Sudoku still applies',
          text: 'Every cell (bulb or shaft) must still satisfy its row, column, and box.',
        },
        {
          term: 'Bulbs can repeat shafts',
          text: 'The bulb digit is not part of the sum. Only the cells along the shaft count.',
        },
      ],
    },
  ],
  popularity: 7,
  generateGivens: generateGivens9x9,
  difficulty: 'intermediate',
  difficultyRank: 2,
  layout: { kind: 'grid', size: 9, box: { rows: 3, cols: 3 } },
  symbols: [1, 2, 3, 4, 5, 6, 7, 8, 9],
  symbolKind: 'digit',
  constraintIds: ['uniqueness', 'arrowSum'],
  overlayIds: ['arrow'],
  annotatorIds: ['arrow-bulb', 'arrow-path'],
  deriveStructure: carveArrows,
};
