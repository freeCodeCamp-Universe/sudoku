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

  it('should render a back link pointing to the provided href', () => {
    renderHeader();

    expect(screen.getByRole('link', { name: /back/i })).toHaveAttribute('href', '/');
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

  it('should render a theme toggle button', () => {
    render(
      <MemoryRouter>
        <ThemeProvider>
          <Header title="Classic Sudoku" backHref="/" />
        </ThemeProvider>
      </MemoryRouter>
    );

    expect(screen.getByRole('button', { name: /theme/i })).toBeTruthy();
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
