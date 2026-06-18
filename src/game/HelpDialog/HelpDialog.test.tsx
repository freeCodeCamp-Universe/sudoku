import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { HelpSection } from '@/engine/types';
import { HelpDialog } from './HelpDialog';

describe('HelpDialog', () => {
  const description = 'Fill each row, column, and box with unique digits.';
  const help: HelpSection[] = [
    {
      label: 'Basic Rules',
      tone: 'basic',
      rules: [
        { term: 'Rows', text: 'Each row uses 1 through 9 exactly once.' },
        { term: 'Columns', text: 'Each column uses 1 through 9 exactly once.' },
      ],
    },
    {
      label: 'Additional Rules',
      tone: 'extra',
      rules: [
        { term: 'Diagonals', text: 'Both main diagonals also use 1 through 9 exactly once.' },
      ],
    },
  ];

  it('should render provided help sections and the controls section', () => {
    render(<HelpDialog open onClose={vi.fn()} help={help} description={description} />);

    expect(screen.getByRole('heading', { name: 'How to Play', level: 2 })).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'Basic Rules', level: 3 })).toBeTruthy();
    expect(screen.getByText('Rows:')).toBeTruthy();
    expect(screen.getByText('Each row uses 1 through 9 exactly once.')).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'Additional Rules', level: 3 })).toBeTruthy();
    expect(screen.getByText('Diagonals:')).toBeTruthy();
    expect(screen.getByText('Both main diagonals also use 1 through 9 exactly once.')).toBeTruthy();
    expect(screen.queryByRole('heading', { name: 'Controls', level: 3 })).toBeNull();
  });

  it('should fall back to the description when no help is provided', () => {
    render(<HelpDialog open onClose={vi.fn()} description={description} />);

    expect(screen.getByRole('heading', { name: 'Basic Rules', level: 3 })).toBeTruthy();
    expect(screen.getByText(description)).toBeTruthy();
  });

  it('should call onClose when Got it is clicked', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();

    render(<HelpDialog open onClose={onClose} description={description} />);
    await user.click(screen.getByRole('button', { name: 'Got it' }));

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('should expose an accessible dialog name through aria-labelledby', () => {
    render(<HelpDialog open onClose={vi.fn()} description={description} />);

    const dialog = screen.getByRole('dialog', { name: 'How to Play' });
    const labelledBy = dialog.getAttribute('aria-labelledby');
    const title = screen.getByRole('heading', { name: 'How to Play', level: 2 });

    expect(dialog).toHaveAccessibleName('How to Play');
    expect(labelledBy).toBeTruthy();
    expect(title.id).toBe(labelledBy);
  });
});
