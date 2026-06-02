import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Toolbar } from './Toolbar';

const baseProps = {
  onClearAll: vi.fn(),
  onReveal: vi.fn(),
};

describe('Toolbar', () => {
  it('should render Reveal Cell and Clear All buttons', () => {
    render(<Toolbar {...baseProps} />);

    expect(screen.getByRole('button', { name: /reveal cell/i })).toBeTruthy();
    expect(screen.getByRole('button', { name: /clear all/i })).toBeTruthy();
  });

  it('should call onReveal when the Reveal Cell button is clicked', async () => {
    const user = userEvent.setup();
    const onReveal = vi.fn();

    render(<Toolbar {...baseProps} onReveal={onReveal} />);
    await user.click(screen.getByRole('button', { name: /reveal cell/i }));

    expect(onReveal).toHaveBeenCalledTimes(1);
  });

  it('should open a confirmation dialog when Clear All is clicked', async () => {
    const user = userEvent.setup();

    render(<Toolbar {...baseProps} />);
    await user.click(screen.getByRole('button', { name: 'Clear All' }));

    expect(screen.getByRole('dialog', { name: /clear all entries\?/i })).toBeTruthy();
  });

  it('should call onClearAll when the clear is confirmed', async () => {
    const user = userEvent.setup();
    const onClearAll = vi.fn();

    render(<Toolbar {...baseProps} onClearAll={onClearAll} />);
    await user.click(screen.getByRole('button', { name: 'Clear All' }));
    const dialog = screen.getByRole('dialog', { name: /clear all entries\?/i });
    await user.click(within(dialog).getByRole('button', { name: 'Clear All' }));

    expect(onClearAll).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('should close the dialog without clearing when Keep Playing is clicked', async () => {
    const user = userEvent.setup();
    const onClearAll = vi.fn();

    render(<Toolbar {...baseProps} onClearAll={onClearAll} />);
    await user.click(screen.getByRole('button', { name: 'Clear All' }));
    await user.click(screen.getByRole('button', { name: /keep playing/i }));

    expect(onClearAll).not.toHaveBeenCalled();
    expect(screen.queryByRole('dialog')).toBeNull();
  });
});
