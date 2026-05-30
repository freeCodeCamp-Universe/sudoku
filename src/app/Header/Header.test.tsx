import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider } from '@/app/ThemeProvider';
import { Header } from './Header';

describe('Header', () => {
  it('should render the variant title', () => {
    render(
      <ThemeProvider>
        <Header title="Classic Sudoku" backHref="/" />
      </ThemeProvider>
    );

    expect(screen.getByRole('heading', { name: 'Classic Sudoku' })).toBeTruthy();
  });

  it('should render a back link pointing to the provided href', () => {
    render(
      <ThemeProvider>
        <Header title="Classic Sudoku" backHref="/" />
      </ThemeProvider>
    );

    expect(screen.getByRole('link', { name: /back/i })).toHaveAttribute('href', '/');
  });

  it('should call onHelpOpen when the help button is clicked', async () => {
    const user = userEvent.setup();
    const onHelpOpen = vi.fn();

    render(
      <ThemeProvider>
        <Header title="Classic Sudoku" backHref="/" onHelpOpen={onHelpOpen} />
      </ThemeProvider>
    );

    await user.click(screen.getByRole('button', { name: /how to play/i }));

    expect(onHelpOpen).toHaveBeenCalledTimes(1);
  });

  it('should render a theme toggle button', () => {
    render(
      <ThemeProvider>
        <Header title="Classic Sudoku" backHref="/" />
      </ThemeProvider>
    );

    expect(screen.getByRole('button', { name: /theme/i })).toBeTruthy();
  });
});
