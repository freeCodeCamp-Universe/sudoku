import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { NumberPad } from './NumberPad';

describe('NumberPad', () => {
  it('should render digit buttons 1-9 plus an erase button', () => {
    render(
      <NumberPad
        symbols={[1, 2, 3, 4, 5, 6, 7, 8, 9]}
        usedSymbols={new Set()}
        onEnter={() => {}}
        candidateMode={false}
      />
    );

    for (let value = 1; value <= 9; value += 1) {
      expect(screen.getByRole('button', { name: String(value) })).toBeTruthy();
    }

    expect(screen.getByRole('button', { name: /erase/i })).toBeTruthy();
  });

  it('should call onEnter with the digit when a number button is clicked', async () => {
    const user = userEvent.setup();
    const onEnter = vi.fn();

    render(
      <NumberPad
        symbols={[1, 2, 3, 4, 5, 6, 7, 8, 9]}
        usedSymbols={new Set()}
        onEnter={onEnter}
        candidateMode={false}
      />
    );

    await user.click(screen.getByRole('button', { name: '5' }));

    expect(onEnter).toHaveBeenCalledWith(5);
  });

  it('should call onEnter with 0 when the erase button is clicked', async () => {
    const user = userEvent.setup();
    const onEnter = vi.fn();

    render(
      <NumberPad
        symbols={[1, 2, 3, 4, 5, 6, 7, 8, 9]}
        usedSymbols={new Set()}
        onEnter={onEnter}
        candidateMode={false}
      />
    );

    await user.click(screen.getByRole('button', { name: /erase/i }));

    expect(onEnter).toHaveBeenCalledWith(0);
  });

  it('should mark buttons for fully-placed symbols as used', () => {
    render(
      <NumberPad
        symbols={[1, 2, 3, 4, 5, 6, 7, 8, 9]}
        usedSymbols={new Set([7])}
        onEnter={() => {}}
        candidateMode={false}
      />
    );

    expect(screen.getByRole('button', { name: '7' })).toBeDisabled();
  });
});
