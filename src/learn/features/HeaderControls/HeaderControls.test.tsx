import { afterEach, describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { courseChrome } from '@/learn/stores/courseChromeStore';
import cfg from '@/../donation-config.json';
import { HeaderControls } from '@/learn/features/HeaderControls/HeaderControls';

afterEach(() => {
  localStorage.clear();
  document.documentElement.removeAttribute('data-theme');
  courseChrome.reset();
});

describe('HeaderControls', () => {
  it('should have a configured donation ID', () => {
    // TODO: Replace this guard with an href assertion once the donation ID
    // is set. See the vim-course HeaderControls.test.tsx for an example
    // that asserts the full donate URL, target="_blank", and
    // rel="noopener noreferrer".
    expect(cfg.donationId).not.toBe('TODO');
  });

  it('should render the drawer, shortcuts, and settings controls', () => {
    render(<HeaderControls />);

    expect(screen.getByRole('button', { name: /open lessons/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /keyboard shortcuts/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'settings' })).toBeInTheDocument();
  });

  it('should hide the drawer control when requested', () => {
    render(<HeaderControls showDrawer={false} />);
    expect(screen.queryByRole('button', { name: /open lessons/i })).not.toBeInTheDocument();
  });

  it('should hide the shortcuts control when requested', () => {
    render(<HeaderControls showShortcuts={false} />);
    expect(screen.queryByRole('button', { name: /keyboard shortcuts/i })).not.toBeInTheDocument();
  });

  it('should open the drawer and shortcuts through the shared store', async () => {
    const user = userEvent.setup();
    render(<HeaderControls />);

    await user.click(screen.getByRole('button', { name: /open lessons/i }));
    expect(courseChrome.getState().drawerOpen).toBe(true);

    await user.click(screen.getByRole('button', { name: /keyboard shortcuts/i }));
    expect(courseChrome.getState().shortcutsOpen).toBe(true);

    await user.click(screen.getByRole('button', { name: 'settings' }));
    expect(courseChrome.getState().settingsOpen).toBe(true);
  });
});
