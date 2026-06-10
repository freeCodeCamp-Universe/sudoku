import { cellId } from '@/engine/grid';
import type { Solution, SymbolValue, Variant, VariantModel } from '@/engine/types';

const SUPER_LABELS: Record<number, string> = {
  1: '1',
  2: '2',
  3: '3',
  4: '4',
  5: '5',
  6: '6',
  7: '7',
  8: '8',
  9: '9',
  10: 'A',
  11: 'B',
  12: 'C',
  13: 'D',
  14: 'E',
  15: 'F',
  16: 'G',
};

function shuffleInPlace<T>(items: T[], rng: () => number): T[] {
  for (let index = items.length - 1; index > 0; index -= 1) {
    const other = Math.floor(rng() * (index + 1));
    [items[index], items[other]] = [items[other], items[index]];
  }

  return items;
}

function shuffledBlocks(blockSize: number, blockCount: number, rng: () => number): number[] {
  const blockOrder = shuffleInPlace(Array.from({ length: blockCount }, (_, index) => index), rng);

  return blockOrder.flatMap((block) =>
    shuffleInPlace(Array.from({ length: blockSize }, (_, index) => block * blockSize + index), rng)
  );
}

function generateSuper16Solution(model: VariantModel, rng: () => number = Math.random): Solution {
  const size = 16;
  const bandSize = 4;
  const symbolOrder = shuffleInPlace([...model.symbols], rng);
  const rowOrder = shuffledBlocks(bandSize, size / bandSize, rng);
  const colOrder = shuffledBlocks(bandSize, size / bandSize, rng);
  const solution: Solution = new Map();

  for (let row = 0; row < size; row += 1) {
    for (let col = 0; col < size; col += 1) {
      const baseValue = ((rowOrder[row] * bandSize + Math.floor(rowOrder[row] / bandSize) + colOrder[col]) % size) + 1;
      solution.set(cellId(row, col), symbolOrder[baseValue - 1]);
    }
  }

  return solution;
}

export const super16: Variant = {
  id: 'super',
  name: 'Super Sudoku',
  description: '16x16 grid using digits 1-9 and letters A-G. Every row, column, and 4x4 box must be complete.',
  help: [
    {
      label: 'Basic Rules',
      tone: 'basic',
      rules: [
        { term: 'The grid', text: 'A 16×16 board divided into sixteen 4×4 boxes. Fill every cell using digits 1-9 and letters A-G.' },
        { term: 'Rows and columns', text: 'Every row and column must contain all 16 symbols exactly once.' },
        { term: 'Boxes', text: 'Each 4×4 box must also hold all 16 symbols exactly once.' },
      ],
    },
    {
      label: 'Additional Rules',
      tone: 'extra',
      rules: [
        { term: 'Given symbols', text: 'Pre-filled cells are fixed. Build your solution around them.' },
        { term: 'Entering symbols', text: 'Use the on-screen pad to enter digits or letters.' },
      ],
    },
  ],
  popularity: 13,
  difficulty: 'advanced',
  layout: { kind: 'grid', size: 16, box: { rows: 4, cols: 4 } },
  symbols: Array.from({ length: 16 }, (_, index) => index + 1),
  symbolKind: 'digit',
  constraintIds: ['uniqueness'],
  overlayIds: [],
  annotatorIds: [],
  minimumClues: 96,
  generateSolution: generateSuper16Solution,
  renderSymbol(value: SymbolValue): string {
    return SUPER_LABELS[value] ?? String(value);
  },
};
