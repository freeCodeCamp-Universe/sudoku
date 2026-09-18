import { describe, expect, it, vi } from 'vitest';
import { useState } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { ThemeProvider } from '@/app/ThemeProvider';
import { Header } from './Header';

function renderHeader() {
  return render(
    <MemoryRouter initialEntries={['/butterfly']}>
      <ThemeProvider>
        <Routes>
          <Route path="/" element={<div>Gallery</div>} />
          <Route path="/butterfly" element={<Header title="Classic Sudoku" backHref="/" />} />
        </Routes>
      </ThemeProvider>
    </MemoryRouter>
  );
}

describe('Header', () => {
  it('should render the variant title', () => {
    renderHeader();

    expect(screen.getByRole('heading', { name: 'Classic Sudoku' })).toBeTruthy();
  });

  it('should toggle the favorite button for the variant', async () => {
    const user = userEvent.setup();
    const onToggleFavorite = vi.fn();

    render(
      <MemoryRouter>
        <ThemeProvider>
          <Header title="Classic Sudoku" backHref="/" onToggleFavorite={onToggleFavorite} />
        </ThemeProvider>
      </MemoryRouter>
    );

    const favoriteButton = screen.getByRole('button', {
      name: 'Add Classic Sudoku to favorites',
    });

    expect(favoriteButton).toHaveAttribute('aria-pressed', 'false');
    await user.click(favoriteButton);

    expect(onToggleFavorite).toHaveBeenCalledTimes(1);
  });

  it('should render a back link pointing to the provided href', () => {
    renderHeader();

    expect(screen.getByRole('link', { name: /back/i })).toHaveAttribute('href', '/');
  });

  it('should render the Donate link with the configured campaign URL', () => {
    renderHeader();

    const donateLink = screen.getByRole('link', { name: 'Donate' });

    expect(donateLink).toHaveAttribute(
      'href',
      'https://donate.freecodecamp.org?source=48283329-5235-43d6-83ba-ef82c42123e1&campaign=test-2026&medium=web'
    );
    expect(donateLink).toHaveAttribute('target', '_blank');
    expect(donateLink).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('should navigate with the router when the back link is clicked', async () => {
    const user = userEvent.setup();
    renderHeader();

    await user.click(screen.getByRole('link', { name: /back/i }));

    expect(screen.getByText('Gallery')).toBeTruthy();
  });

  it('should call onHelpOpen when the help button is clicked', async () => {
    const user = userEvent.setup();
    const onHelpOpen = vi.fn();

    render(
      <MemoryRouter>
        <ThemeProvider>
          <Header title="Classic Sudoku" backHref="/" onHelpOpen={onHelpOpen} />
        </ThemeProvider>
      </MemoryRouter>
    );

    await user.click(screen.getByRole('button', { name: /how to play/i }));

    expect(onHelpOpen).toHaveBeenCalledTimes(1);
  });

  it('should render a theme toggle button labeled with the target theme', () => {
    render(
      <MemoryRouter>
        <ThemeProvider>
          <Header title="Classic Sudoku" backHref="/" />
        </ThemeProvider>
      </MemoryRouter>
    );

    expect(screen.getByRole('button', { name: /switch to light theme/i })).toBeTruthy();
  });

  it('should update the theme button label and announce the new theme after toggling', async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <ThemeProvider>
          <Header title="Classic Sudoku" backHref="/" />
        </ThemeProvider>
      </MemoryRouter>
    );

    await user.click(screen.getByRole('button', { name: /switch to light theme/i }));

    expect(screen.getByRole('button', { name: /switch to dark theme/i })).toBeTruthy();
    expect(screen.getByRole('status')).toHaveTextContent('Light theme');
  });

  describe('settings', () => {
    function SettingsHarness() {
      const [checkEnabled, setCheckEnabled] = useState(false);
      const [timerEnabled, setTimerEnabled] = useState(false);

      return (
        <MemoryRouter>
          <ThemeProvider>
            <Header
              title="Classic Sudoku"
              backHref="/"
              checkEnabled={checkEnabled}
              timerEnabled={timerEnabled}
              onToggleCheck={() => setCheckEnabled((v) => !v)}
              onToggleTimer={() => setTimerEnabled((v) => !v)}
            />
          </ThemeProvider>
        </MemoryRouter>
      );
    }

    it('should expose proper switch semantics for Check answers and Timer', async () => {
      const user = userEvent.setup();

      render(<SettingsHarness />);

      // Open settings
      await user.click(screen.getByRole('button', { name: /settings/i }));

      const checkSwitch = screen.getByRole('switch', { name: /check answers/i });
      expect(checkSwitch).not.toBeChecked();

      const timerSwitch = screen.getByRole('switch', { name: /timer/i });
      expect(timerSwitch).not.toBeChecked();

      await user.click(checkSwitch);
      expect(checkSwitch).toBeChecked();

      await user.click(timerSwitch);
      expect(timerSwitch).toBeChecked();
    });

    it('should expose the dark theme switch first in the settings list', async () => {
      const user = userEvent.setup();
      localStorage.clear();
      document.documentElement.classList.remove('light');

      render(<SettingsHarness />);

      await user.click(screen.getByRole('button', { name: /settings/i }));

      const switches = screen.getAllByRole('switch');
      expect(switches[0]).toHaveAccessibleName('Dark theme');
      expect(switches[0]).toBeChecked();

      await user.click(switches[0]);

      expect(switches[0]).not.toBeChecked();
      expect(document.documentElement).toHaveClass('light');
    });

    it('should toggle the global high-contrast palette from the settings dropdown', async () => {
      const user = userEvent.setup();
      localStorage.clear();
      document.documentElement.classList.remove('high-contrast');

      render(<SettingsHarness />);

      await user.click(screen.getByRole('button', { name: /settings/i }));

      const highContrastSwitch = screen.getByRole('switch', { name: /high contrast/i });
      expect(highContrastSwitch).not.toBeChecked();

      await user.click(highContrastSwitch);
      expect(highContrastSwitch).toBeChecked();
      expect(document.documentElement.classList.contains('high-contrast')).toBe(true);

      document.documentElement.classList.remove('high-contrast');
    });

    it('should render the Navigation on left toggle when onToggleNavOnLeft is provided', async () => {
      const user = userEvent.setup();

      render(
        <MemoryRouter>
          <ThemeProvider>
            <Header
              title="Classic Sudoku"
              backHref="/"
              navOnLeftEnabled={false}
              onToggleNavOnLeft={vi.fn()}
            />
          </ThemeProvider>
        </MemoryRouter>
      );

      await user.click(screen.getByRole('button', { name: /settings/i }));

      const navOnLeftSwitch = screen.getByRole('switch', { name: /navigation on left/i });
      expect(navOnLeftSwitch).toBeInTheDocument();
      expect(navOnLeftSwitch).not.toBeChecked();
    });

    it('should not render the Navigation on left toggle when onToggleNavOnLeft is not provided', async () => {
      const user = userEvent.setup();

      render(
        <MemoryRouter>
          <ThemeProvider>
            <Header title="Classic Sudoku" backHref="/" onToggleCheck={vi.fn()} />
          </ThemeProvider>
        </MemoryRouter>
      );

      await user.click(screen.getByRole('button', { name: /settings/i }));

      expect(screen.queryByRole('switch', { name: /navigation on left/i })).not.toBeInTheDocument();
    });

    it('should call onToggleNavOnLeft when the Navigation on left switch is clicked', async () => {
      const user = userEvent.setup();
      const onToggleNavOnLeft = vi.fn();

      render(
        <MemoryRouter>
          <ThemeProvider>
            <Header
              title="Classic Sudoku"
              backHref="/"
              navOnLeftEnabled={false}
              onToggleNavOnLeft={onToggleNavOnLeft}
            />
          </ThemeProvider>
        </MemoryRouter>
      );

      await user.click(screen.getByRole('button', { name: /settings/i }));
      await user.click(screen.getByRole('switch', { name: /navigation on left/i }));

      expect(onToggleNavOnLeft).toHaveBeenCalledTimes(1);
    });

    it('should reflect navOnLeftEnabled=true on the Navigation on left switch', async () => {
      const user = userEvent.setup();

      render(
        <MemoryRouter>
          <ThemeProvider>
            <Header
              title="Classic Sudoku"
              backHref="/"
              navOnLeftEnabled={true}
              onToggleNavOnLeft={vi.fn()}
            />
          </ThemeProvider>
        </MemoryRouter>
      );

      await user.click(screen.getByRole('button', { name: /settings/i }));

      expect(screen.getByRole('switch', { name: /navigation on left/i })).toBeChecked();
    });

    it('should implement ARIA Disclosure pattern and handle Escape key', async () => {
      const user = userEvent.setup();
      render(<SettingsHarness />);

      const settingsBtn = screen.getByRole('button', { name: /settings/i });

      // Initial state
      expect(settingsBtn).toHaveAttribute('aria-expanded', 'false');
      expect(settingsBtn).not.toHaveAttribute('aria-controls');
      expect(screen.queryByRole('group', { name: /settings/i })).toBeNull();

      // Open settings
      await user.click(settingsBtn);
      expect(settingsBtn).toHaveAttribute('aria-expanded', 'true');
      expect(settingsBtn).toHaveAttribute('aria-controls', 'header-settings-panel');

      const panel = screen.getByRole('group', { name: /settings/i });
      expect(panel).toBeInTheDocument();
      expect(panel).toHaveAttribute('id', 'header-settings-panel');

      // Close with Escape
      await user.keyboard('{Escape}');
      expect(screen.queryByRole('group', { name: /settings/i })).toBeNull();
      expect(settingsBtn).toHaveAttribute('aria-expanded', 'false');
      expect(settingsBtn).toHaveFocus();
    });
  });
});
