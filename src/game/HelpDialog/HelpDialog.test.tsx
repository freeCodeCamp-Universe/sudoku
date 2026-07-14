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
    expect(
      screen.getByText(
        'A 9×9 board divided into nine 3×3 boxes. Fill every cell with a symbol from 1 to 9.'
      )
    ).toBeTruthy();
  });

  it('should override basic rules when basicRules prop is provided', () => {
    render(<HelpDialog open onClose={vi.fn()} basicRules={customBasicRules} />);

    expect(screen.queryByRole('heading', { name: 'Basic Rules', level: 3 })).toBeNull();
    expect(screen.getByText('A 4×4 board split into four 2×2 boxes.')).toBeTruthy();
    expect(screen.queryByText(/9×9 board/)).toBeNull();
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

  it('should expose an accessible dialog name through aria-labelledby', () => {
    render(<HelpDialog open onClose={vi.fn()} />);

    const dialog = screen.getByRole('dialog', { name: 'How to Play' });
    const labelledBy = dialog.getAttribute('aria-labelledby');
    const title = screen.getByRole('heading', { name: 'How to Play', level: 2 });

    expect(dialog).toHaveAccessibleName('How to Play');
    expect(labelledBy).toBeTruthy();
    expect(title.id).toBe(labelledBy);
  });
});
