import { describe, expect, it } from 'vitest';
import { sudokuX } from '@/variants/sudoku-x';
import { windoku } from '@/variants/windoku';
import { renderVariantBoard } from './renderVariantBoard';

describe('renderVariantBoard', () => {
  it('should mark the diagonal cells on sudoku-x', () => {
    const { getCell } = renderVariantBoard(sudokuX);

    expect(getCell('r0c0')).toHaveAttribute('data-diagonal', 'true');
    expect(getCell('r0c1')).not.toHaveAttribute('data-diagonal');
  });

  it('should mark a window cell on windoku', () => {
    const { getCell } = renderVariantBoard(windoku);

    expect(getCell('r1c1')).toHaveAttribute('data-window', 'true');
  });
});
