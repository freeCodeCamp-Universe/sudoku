import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Navbar } from '@/learn/base/Navbar/Navbar';

describe('Navbar', () => {
  it('should render a home link', () => {
    render(<Navbar onOpenShortcuts={vi.fn()} onOpenSettings={vi.fn()} />);

    const link = screen.getByRole('link', { name: 'Home' });
    expect(link).toHaveAttribute('href', '/');
  });

  it('should call onOpenSettings when the settings button is clicked', async () => {
    const user = userEvent.setup();
    const onOpenSettings = vi.fn();
    render(<Navbar onOpenShortcuts={vi.fn()} onOpenSettings={onOpenSettings} />);

    await user.click(screen.getByRole('button', { name: 'settings' }));

    expect(onOpenSettings).toHaveBeenCalledOnce();
  });

  it('should call onOpenShortcuts when the keyboard shortcuts button is clicked', async () => {
    const user = userEvent.setup();
    const onOpenShortcuts = vi.fn();
    render(<Navbar onOpenShortcuts={onOpenShortcuts} onOpenSettings={vi.fn()} />);

    await user.click(screen.getByRole('button', { name: 'keyboard shortcuts' }));

    expect(onOpenShortcuts).toHaveBeenCalledOnce();
  });

  it('should render a donate link', () => {
    render(<Navbar onOpenShortcuts={vi.fn()} onOpenSettings={vi.fn()} />);

    const link = screen.getByRole('link', { name: 'Donate' });
    expect(link).toHaveAttribute(
      'href',
      'https://donate.freecodecamp.org?source=48283329-5235-43d6-83ba-ef82c42123e1&campaign=Sudoku&medium=web'
    );
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  });
});
