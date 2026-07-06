import { beforeEach, describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider } from './ThemeProvider';
import { useTheme } from './context';

function ThemeConsumer() {
  const { theme, toggleTheme, highContrast, toggleHighContrast } = useTheme();

  return (
    <div>
      <span data-testid="theme">{theme}</span>
      <span data-testid="high-contrast">{String(highContrast)}</span>
      <button type="button" onClick={toggleTheme}>
        toggle
      </button>
      <button type="button" onClick={toggleHighContrast}>
        toggle high contrast
      </button>
    </div>
  );
}

describe('ThemeProvider', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove('light', 'high-contrast');
  });

  it('should default to dark theme', () => {
    render(
      <ThemeProvider>
        <ThemeConsumer />
      </ThemeProvider>
    );

    expect(screen.getByTestId('theme')).toHaveTextContent('dark');
  });

  it('should apply the stored theme on mount', () => {
    localStorage.setItem('sudoku-theme', 'light');

    render(
      <ThemeProvider>
        <ThemeConsumer />
      </ThemeProvider>
    );

    expect(screen.getByTestId('theme')).toHaveTextContent('light');
  });

  it('should toggle from dark to light and persist to localStorage', async () => {
    const user = userEvent.setup();

    render(
      <ThemeProvider>
        <ThemeConsumer />
      </ThemeProvider>
    );

    await user.click(screen.getByRole('button', { name: 'toggle' }));

    expect(screen.getByTestId('theme')).toHaveTextContent('light');
    expect(localStorage.getItem('sudoku-theme')).toBe('light');
  });

  it('should add the light class to document.documentElement when theme is light', async () => {
    const user = userEvent.setup();

    render(
      <ThemeProvider>
        <ThemeConsumer />
      </ThemeProvider>
    );

    await user.click(screen.getByRole('button', { name: 'toggle' }));

    expect(document.documentElement.classList.contains('light')).toBe(true);
  });

  it('should not announce theme on initial render', () => {
    render(
      <ThemeProvider>
        <ThemeConsumer />
      </ThemeProvider>
    );

    expect(screen.getByRole('status')).toHaveTextContent('');
  });

  it('should announce "Light theme" after toggling to light', async () => {
    const user = userEvent.setup();

    render(
      <ThemeProvider>
        <ThemeConsumer />
      </ThemeProvider>
    );

    await user.click(screen.getByRole('button', { name: 'toggle' }));

    expect(screen.getByRole('status')).toHaveTextContent('Light theme');
  });

  it('should announce "Dark theme" after toggling back to dark', async () => {
    const user = userEvent.setup();

    render(
      <ThemeProvider>
        <ThemeConsumer />
      </ThemeProvider>
    );

    await user.click(screen.getByRole('button', { name: 'toggle' }));
    await user.click(screen.getByRole('button', { name: 'toggle' }));

    expect(screen.getByRole('status')).toHaveTextContent('Dark theme');
  });

  it('should default high contrast to off', () => {
    render(
      <ThemeProvider>
        <ThemeConsumer />
      </ThemeProvider>
    );

    expect(screen.getByTestId('high-contrast')).toHaveTextContent('false');
    expect(document.documentElement.classList.contains('high-contrast')).toBe(false);
  });

  it('should toggle high contrast, add the class, and persist to localStorage', async () => {
    const user = userEvent.setup();

    render(
      <ThemeProvider>
        <ThemeConsumer />
      </ThemeProvider>
    );

    await user.click(screen.getByRole('button', { name: 'toggle high contrast' }));

    expect(screen.getByTestId('high-contrast')).toHaveTextContent('true');
    expect(document.documentElement.classList.contains('high-contrast')).toBe(true);
    expect(localStorage.getItem('sudoku-high-contrast')).toBe('true');
  });

  it('should apply the stored high-contrast setting on mount', () => {
    localStorage.setItem('sudoku-high-contrast', 'true');

    render(
      <ThemeProvider>
        <ThemeConsumer />
      </ThemeProvider>
    );

    expect(document.documentElement.classList.contains('high-contrast')).toBe(true);
  });

  it('should migrate an enabled legacy colorblind setting to high contrast', () => {
    localStorage.setItem('sudoku-colorblind', 'true');

    render(
      <ThemeProvider>
        <ThemeConsumer />
      </ThemeProvider>
    );

    expect(screen.getByTestId('high-contrast')).toHaveTextContent('true');
    expect(localStorage.getItem('sudoku-high-contrast')).toBe('true');
    expect(localStorage.getItem('sudoku-colorblind')).toBeNull();
  });

  it('should not enable high contrast when the stored setting overrides the legacy one', () => {
    localStorage.setItem('sudoku-colorblind', 'true');
    localStorage.setItem('sudoku-high-contrast', 'false');

    render(
      <ThemeProvider>
        <ThemeConsumer />
      </ThemeProvider>
    );

    expect(screen.getByTestId('high-contrast')).toHaveTextContent('false');
  });
});
