import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { DPad } from './DPad';

describe('DPad', () => {
  it('should expose an accessible button for each direction', () => {
    render(<DPad onMove={vi.fn()} />);
    expect(screen.getByRole('button', { name: 'Move up' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Move down' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Move left' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Move right' })).toBeInTheDocument();
  });

  it('should call onMove with the direction when a button is pressed', async () => {
    const user = userEvent.setup();
    const onMove = vi.fn();
    render(<DPad onMove={onMove} />);

    await user.click(screen.getByRole('button', { name: 'Move up' }));
    await user.click(screen.getByRole('button', { name: 'Move right' }));

    expect(onMove).toHaveBeenNthCalledWith(1, 'up');
    expect(onMove).toHaveBeenNthCalledWith(2, 'right');
  });
});
