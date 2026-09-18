import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import cfg from '@/../donation-config.json';
import { Navbar } from '@/learn/base/Navbar/Navbar';

describe('Navbar', () => {
  it('should have a configured donation ID', () => {
    // TODO: Replace this guard with an href assertion once the donation ID is
    // set. See the vim-course HeaderControls.test.tsx for an example that
    // asserts the full donate URL, target="_blank", and rel="noopener noreferrer".
    expect(cfg.donationId).not.toBe('TODO');
  });

  it('should render a home link', () => {
    render(<Navbar onOpenShortcuts={vi.fn()} onOpenSettings={vi.fn()} />);

    const link = screen.getByRole('link', { name: '{{PROJECT_NAME}}' });
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

    expect(screen.getByRole('link', { name: 'Donate' })).toBeInTheDocument();
  });
});
