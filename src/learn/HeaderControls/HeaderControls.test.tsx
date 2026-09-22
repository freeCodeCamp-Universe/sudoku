import { afterEach, describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { courseChrome } from '@/learn/stores/courseChromeStore';
import cfg from '@/../donation-config.json';
import { HeaderControls } from '@/learn/HeaderControls/HeaderControls';
import { ThemeProvider } from '@/app/ThemeProvider';

afterEach(() => {
  localStorage.clear();
  document.documentElement.removeAttribute('data-theme');
  document.documentElement.className = '';
  courseChrome.reset();
});

function renderControls(ui: React.ReactNode = <HeaderControls />) {
  return render(<ThemeProvider>{ui}</ThemeProvider>);
}

describe('HeaderControls', () => {
  it('should have a configured donation ID', () => {
    // TODO: Replace this guard with an href assertion once the donation ID
    // is set. See the course HeaderControls.test.tsx for an example
    // that asserts the full donate URL, target="_blank", and
    // rel="noopener noreferrer".
    expect(cfg.donationId).not.toBe('TODO');
  });

  it('should render the drawer, shortcuts, and settings controls', () => {
    renderControls();

    expect(screen.getByRole('button', { name: /open lessons/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /keyboard shortcuts/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Settings' })).toBeInTheDocument();
  });

  it('should render the theme toggle without settings when requested', () => {
    renderControls(<HeaderControls showSettings={false} showThemeToggle />);

    expect(screen.queryByRole('button', { name: 'Settings' })).not.toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /switch to (dark|light) theme/i })
    ).toBeInTheDocument();
  });

  it('should hide the drawer control when requested', () => {
    renderControls(<HeaderControls showDrawer={false} />);
    expect(screen.queryByRole('button', { name: /open lessons/i })).not.toBeInTheDocument();
  });

  it('should hide the shortcuts control when requested', () => {
    renderControls(<HeaderControls showShortcuts={false} />);
    expect(screen.queryByRole('button', { name: /keyboard shortcuts/i })).not.toBeInTheDocument();
  });

  it('should open the drawer and shortcuts through the shared store', async () => {
    const user = userEvent.setup();
    renderControls();

    await user.click(screen.getByRole('button', { name: /open lessons/i }));
    expect(courseChrome.getState().drawerOpen).toBe(true);

    await user.click(screen.getByRole('button', { name: /keyboard shortcuts/i }));
    expect(courseChrome.getState().shortcutsOpen).toBe(true);

    await user.click(screen.getByRole('button', { name: 'Settings' }));
    expect(courseChrome.getState().settingsOpen).toBe(true);
  });

  it('should render the settings dropdown with global preferences', async () => {
    const user = userEvent.setup();
    renderControls();

    await user.click(screen.getByRole('button', { name: 'Settings' }));

    expect(screen.getByRole('group', { name: 'Settings' })).toBeInTheDocument();
    expect(screen.getByRole('switch', { name: 'Dark theme' })).toBeInTheDocument();
    expect(screen.getByRole('switch', { name: 'Keyboard shortcuts' })).toBeInTheDocument();
    expect(screen.queryByRole('switch', { name: 'Animations' })).not.toBeInTheDocument();
    expect(screen.getByRole('switch', { name: 'High contrast' })).toBeInTheDocument();
  });

  it('should close the settings dropdown with Escape and restore focus', async () => {
    const user = userEvent.setup();
    renderControls();

    const settings = screen.getByRole('button', { name: 'Settings' });
    await user.click(settings);
    await user.keyboard('{Escape}');

    expect(screen.queryByRole('group', { name: 'Settings' })).not.toBeInTheDocument();
    expect(settings).toHaveFocus();
  });
});
