import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Button } from './Button';

describe('Button', () => {
  it('should render a button with its accessible name', () => {
    render(<Button>Reveal Cell</Button>);

    expect(screen.getByRole('button', { name: 'Reveal Cell' })).toBeTruthy();
  });

  it('should default the native button type to button', () => {
    render(<Button>Clear All</Button>);

    expect(screen.getByRole('button', { name: 'Clear All' })).toHaveAttribute('type', 'button');
  });

  it('should forward onClick', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();

    render(<Button onClick={onClick}>New Game</Button>);
    await user.click(screen.getByRole('button', { name: 'New Game' }));

    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('should forward arbitrary props', () => {
    render(<Button aria-label="Start over" />);

    expect(screen.getByRole('button', { name: 'Start over' })).toBeTruthy();
  });
});
