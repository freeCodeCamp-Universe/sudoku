import { useReducer } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { Board } from '@/board/Board';
import { boardReducer, createBoardState } from '@/board/boardReducer';
import { InputModeTabs } from '@/board/InputModeTabs';
import { NumberPad } from '@/board/NumberPad';
import type { BoardAction, BoardState } from '@/board/boardReducer';
import type { Values } from '@/engine/types';
import { buildModel } from '@/engine/buildModel';
import { getVariant } from '@/variants/registry';
import { usePlayableBoard } from './usePlayableBoard';

const variant = getVariant('classic');
const baseModel = buildModel(variant);
const givens: Values = new Map();
const solution: Values = new Map([
  ['r0c0', 1],
  ['r0c1', 2],
]);

function PlayableBoardFixture() {
  const [state, dispatch] = useReducer(
    (current: BoardState, action: BoardAction) => boardReducer(current, action, givens),
    createBoardState(givens)
  );
  const { boardProps, numberPadProps, inputModeProps } = usePlayableBoard({
    variant,
    baseModel,
    givens,
    solution,
    seedBase: 1,
    cellSize: 40,
    state,
    dispatch,
  });

  return (
    <>
      <Board {...boardProps} />
      <InputModeTabs {...inputModeProps} numberPad={<NumberPad {...numberPadProps} />} />
    </>
  );
}

describe('usePlayableBoard', () => {
  it('should render a playable board and input controls from the hook output', async () => {
    const user = userEvent.setup();
    render(<PlayableBoardFixture />);

    await user.click(screen.getByRole('gridcell', { name: /row 1, column 1, box 1, empty/i }));
    await user.click(screen.getByRole('button', { name: '4' }));
    expect(screen.getByRole('gridcell', { name: /row 1, column 1, box 1, 4/i })).toBeTruthy();

    await user.click(screen.getByRole('gridcell', { name: /row 1, column 2, box 1, empty/i }));
    await user.click(screen.getByRole('tab', { name: 'Candidate' }));
    await user.click(screen.getByRole('button', { name: '5' }));

    expect(
      screen.getByRole('gridcell', { name: /row 1, column 2, box 1, candidate 5/i })
    ).toBeTruthy();
  });
});
