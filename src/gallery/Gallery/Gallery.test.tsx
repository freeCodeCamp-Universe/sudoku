import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { ThemeProvider } from '@/app/ThemeProvider';
import { variantRegistry } from '@/variants/registry';
import { Gallery } from './Gallery';

vi.mock('@/gallery/VariantCard', () => ({
  VariantCard: ({
    variant,
  }: {
    variant: { id: string; name: string; difficulty: string };
  }) => <a href={`/${variant.id}`}>{`${variant.name} (${variant.difficulty})`}</a>,
}));

function renderGallery() {
  return render(
    <MemoryRouter>
      <ThemeProvider>
        <Gallery />
      </ThemeProvider>
    </MemoryRouter>
  );
}

describe('Gallery', () => {
  it('should render a card for every variant in the registry', () => {
    renderGallery();

    expect(screen.getAllByRole('link')).toHaveLength(Object.keys(variantRegistry).length);
  });

  it('should filter cards when a search term matches a variant name', async () => {
    const user = userEvent.setup();

    renderGallery();

    await user.type(screen.getByRole('searchbox', { name: /search puzzles/i }), 'classic');

    expect(screen.getByText(/Classic Sudoku/i)).toBeTruthy();
  });

  it('should hide non-matching cards when searching', async () => {
    const user = userEvent.setup();

    renderGallery();

    await user.type(screen.getByRole('searchbox', { name: /search puzzles/i }), 'zzzznotavariant');

    expect(screen.queryByText(/Classic Sudoku/i)).toBeNull();
  });

  it('should filter by difficulty text', async () => {
    const user = userEvent.setup();

    renderGallery();

    await user.type(screen.getByRole('searchbox', { name: /search puzzles/i }), 'beginner');

    expect(screen.getAllByRole('link').length).toBeGreaterThan(0);
    expect(screen.queryByText(/Arrow Sudoku/i)).toBeNull();
  });

  it('should filter cards when a search term matches a variant description', async () => {
    const user = userEvent.setup();

    renderGallery();

    await user.type(screen.getByRole('searchbox', { name: /search puzzles/i }), 'triangular');

    expect(screen.getByText(/Sujiken/i)).toBeTruthy();
  });

  it('should sort cards alphabetically when requested', async () => {
    const user = userEvent.setup();

    renderGallery();

    expect(screen.getAllByRole('link')[0]).toHaveTextContent(/Classic Sudoku/i);

    await user.selectOptions(screen.getByRole('combobox', { name: /sort puzzles by/i }), 'alpha');

    expect(screen.getAllByRole('link')[0]).toHaveTextContent(/Argyle Sudoku/i);
  });

  it('should show a no-results message when nothing matches', async () => {
    const user = userEvent.setup();

    renderGallery();

    await user.type(screen.getByRole('searchbox', { name: /search puzzles/i }), 'zzzznotavariant');

    expect(screen.getByText(/No puzzles match your search\./i)).toBeTruthy();
  });

  it('should label the theme button with the target theme', () => {
    renderGallery();

    expect(screen.getByRole('button', { name: /switch to light theme/i })).toBeTruthy();
  });

  it('should update the theme button label and announce the new theme after toggling', async () => {
    const user = userEvent.setup();

    renderGallery();

    await user.click(screen.getByRole('button', { name: /switch to light theme/i }));

    expect(screen.getByRole('button', { name: /switch to dark theme/i })).toBeTruthy();
    expect(screen.getByRole('status')).toHaveTextContent('Light theme');
  });
});
