import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { HelpRule, HelpSection } from '@/engine/types';
import { HelpDialog } from './HelpDialog';

describe('HelpDialog', () => {
  const extraHelp: HelpSection[] = [
    {
      label: 'Additional Rules',
      tone: 'extra',
      rules: [
        { term: 'Diagonals', text: 'Both main diagonals also use 1 through 9 exactly once.' },
      ],
    },
  ];

  const customBasicRules: HelpRule[] = [
    { term: 'The grid', text: 'A 4×4 board split into four 2×2 boxes.' },
    { term: 'Symbols', text: 'Fill every cell with a symbol from 1 to 4.' },
  ];

  it('should show the standard basic rules by default', () => {
    render(<HelpDialog open onClose={vi.fn()} />);

    expect(screen.queryByRole('heading', { name: 'Basic Rules', level: 3 })).toBeNull();
    expect(screen.getByText('The board:')).toBeTruthy();
    // Rule text is interleaved with no-wrap token spans, so match on the
    // list item's full text content instead of a single text node.
    expect(
      screen
        .getAllByRole('listitem')
        .some(
          (item) =>
            item.textContent ===
            'The board: A 9×9 board divided into nine 3×3 boxes. Fill every cell with a symbol from 1 to 9.'
        )
    ).toBe(true);
  });

  it('should override basic rules when basicRules prop is provided', () => {
    render(<HelpDialog open onClose={vi.fn()} basicRules={customBasicRules} />);

    expect(screen.queryByRole('heading', { name: 'Basic Rules', level: 3 })).toBeNull();
    expect(
      screen
        .getAllByRole('listitem')
        .some((item) => item.textContent === 'The grid: A 4×4 board split into four 2×2 boxes.')
    ).toBe(true);
    expect(
      screen.getAllByRole('listitem').some((item) => item.textContent?.includes('9×9 board'))
    ).toBe(false);
  });

  it('should render extra help sections below basic rules', () => {
    render(<HelpDialog open onClose={vi.fn()} help={extraHelp} />);

    expect(screen.getByRole('heading', { name: 'Basic Rules', level: 3 })).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'Additional Rules', level: 3 })).toBeTruthy();
    expect(screen.getByText('Diagonals:')).toBeTruthy();
  });

  it('should call onClose when Got it is clicked', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();

    render(<HelpDialog open onClose={onClose} />);
    await user.click(screen.getByRole('button', { name: 'Got it' }));

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('should title the dialog "How to Play"', () => {
    render(<HelpDialog open onClose={vi.fn()} />);

    expect(screen.getByRole('dialog', { name: 'How to Play' })).toBeTruthy();
  });
});
