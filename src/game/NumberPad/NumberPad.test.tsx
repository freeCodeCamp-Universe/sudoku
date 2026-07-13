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

  it('should expose the pad as a single-tab-stop grid', async () => {
    const user = userEvent.setup();

    render(
      <>
        <NumberPad
          symbols={[1, 2, 3, 4, 5, 6, 7, 8, 9]}
          usedSymbols={new Set()}
          onEnter={() => {}}
          candidateMode={false}
        />
        <button type="button">After</button>
      </>
    );

    expect(screen.getByRole('grid', { name: 'Number pad' })).toBeTruthy();

    await user.tab();
    expect(screen.getByRole('button', { name: '1' })).toHaveFocus();

    await user.tab();
    expect(screen.getByRole('button', { name: 'After' })).toHaveFocus();
  });

  it('should move focus between buttons with the arrow keys', async () => {
    const user = userEvent.setup();

    render(
      <NumberPad
        symbols={[1, 2, 3, 4, 5, 6, 7, 8, 9]}
        usedSymbols={new Set()}
        onEnter={() => {}}
        candidateMode={false}
      />
    );

    // Default layout: rows of 5, Erase appended to the last row.
    await user.tab();
    expect(screen.getByRole('button', { name: '1' })).toHaveFocus();

    await user.keyboard('{ArrowRight}');
    expect(screen.getByRole('button', { name: '2' })).toHaveFocus();

    await user.keyboard('{ArrowDown}');
    expect(screen.getByRole('button', { name: '7' })).toHaveFocus();

    await user.keyboard('{End}');
    expect(screen.getByRole('button', { name: 'Erase' })).toHaveFocus();

    await user.keyboard('{Home}');
    expect(screen.getByRole('button', { name: '6' })).toHaveFocus();

    await user.keyboard('{ArrowUp}{ArrowLeft}');
    expect(screen.getByRole('button', { name: '1' })).toHaveFocus();
  });

  it('should keep focus on the edge button when arrowing past the grid edge', async () => {
    const user = userEvent.setup();

    render(
      <NumberPad
        symbols={[1, 2, 3, 4, 5, 6, 7, 8, 9]}
        usedSymbols={new Set()}
        onEnter={() => {}}
        candidateMode={false}
      />
    );

    await user.tab();
    await user.keyboard('{ArrowLeft}{ArrowUp}');
    expect(screen.getByRole('button', { name: '1' })).toHaveFocus();
  });

  it('should return to the last focused button when tabbing back into the pad', async () => {
    const user = userEvent.setup();

    render(
      <>
        <NumberPad
          symbols={[1, 2, 3, 4, 5, 6, 7, 8, 9]}
          usedSymbols={new Set()}
          onEnter={() => {}}
          candidateMode={false}
        />
        <button type="button">After</button>
      </>
    );

    await user.tab();
    await user.keyboard('{ArrowRight}{ArrowRight}');
    expect(screen.getByRole('button', { name: '3' })).toHaveFocus();

    await user.tab();
    expect(screen.getByRole('button', { name: 'After' })).toHaveFocus();

    await user.tab({ shift: true });
    expect(screen.getByRole('button', { name: '3' })).toHaveFocus();
  });

  it('should use descriptive aria-labels for color symbols', () => {
    render(
      <NumberPad
        symbols={[1, 2, 3]}
        usedSymbols={new Set()}
        onEnter={() => {}}
        candidateMode={false}
        renderSymbol={() => '#d4a828'}
        describeSymbol={(value) => ['Red', 'Orange', 'Yellow'][value - 1]}
        symbolKind="color"
      />
    );

    expect(screen.getByRole('button', { name: 'Yellow' })).toBeTruthy();
  });
});
