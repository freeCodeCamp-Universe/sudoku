import { describe, expect, it, vi } from 'vitest';
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
});
