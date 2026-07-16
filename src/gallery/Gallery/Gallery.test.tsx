import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ThemeProvider } from '@/app/ThemeProvider';
import { variantRegistry } from '@/variants/registry';
import { Gallery } from './Gallery';

vi.mock('@/gallery/VariantCard', () => ({
  VariantCard: ({
    variant,
    isFavorite,
    onToggleFavorite,
  }: {
    variant: { id: string; name: string; difficulty: string };
    isFavorite: boolean;
    onToggleFavorite: (id: string) => void;
  }) => (
    <div>
      <a href={`/${variant.id}`}>{`${variant.name} (${variant.difficulty})`}</a>
      <button
        type="button"
        aria-pressed={isFavorite}
        aria-label={`Favorite ${variant.id}`}
        onClick={() => onToggleFavorite(variant.id)}
      />
    </div>
  ),
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

afterEach(() => {
  window.localStorage.clear();
});

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

    expect(screen.getAllByRole('link')[0]).toHaveTextContent(/4×4 Sudoku/i);
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
    expect(screen.getByText('Light theme')).toBeTruthy();
  });

  it('should announce the result count when a search matches', async () => {
    const user = userEvent.setup();

    renderGallery();

    await user.type(screen.getByRole('searchbox', { name: /search puzzles/i }), 'classic');

    const count = screen.getAllByRole('link').length;
    expect(screen.getByText(new RegExp(`${count} puzzles? found\\.`))).toBeTruthy();
  });

  it('should announce when a search matches nothing', async () => {
    const user = userEvent.setup();

    renderGallery();

    await user.type(screen.getByRole('searchbox', { name: /search puzzles/i }), 'zzzznotavariant');

    expect(screen.getByText('No puzzles found.')).toBeTruthy();
  });

  it('should announce the sort mode when sorting changes', async () => {
    const user = userEvent.setup();

    renderGallery();

    await user.selectOptions(screen.getByRole('combobox', { name: /sort puzzles by/i }), 'alpha');

    expect(screen.getByText('Sorted by A-Z.')).toBeTruthy();
  });

  it('should show only favorited cards when Favorites only is on', async () => {
    const user = userEvent.setup();

    renderGallery();

    await user.click(screen.getByRole('button', { name: 'Favorite classic' }));
    await user.click(screen.getByRole('button', { name: 'Favorites only' }));

    expect(screen.getAllByRole('link')).toHaveLength(1);
    expect(screen.getByText(/Classic Sudoku/i)).toBeTruthy();
  });

  it('should restore the full grid when Favorites only is turned off again', async () => {
    const user = userEvent.setup();

    renderGallery();

    await user.click(screen.getByRole('button', { name: 'Favorite classic' }));
    await user.click(screen.getByRole('button', { name: 'Favorites only' }));
    await user.click(screen.getByRole('button', { name: 'Favorites only' }));

    expect(screen.getAllByRole('link')).toHaveLength(Object.keys(variantRegistry).length);
  });

  it('should show the empty-favorites message when filtering with no favorites', async () => {
    const user = userEvent.setup();

    renderGallery();

    await user.click(screen.getByRole('button', { name: 'Favorites only' }));

    expect(
      screen.getByText('No favorite puzzles yet. Tap the star on a card to save it.')
    ).toBeTruthy();
  });

  it('should announce the favorites filter with its result count', async () => {
    const user = userEvent.setup();

    renderGallery();

    await user.click(screen.getByRole('button', { name: 'Favorite classic' }));
    await user.click(screen.getByRole('button', { name: 'Favorites only' }));

    expect(screen.getByText('Showing favorites only. 1 puzzle found.')).toBeTruthy();
  });

  it('should persist favorites and the filter across mounts', async () => {
    const user = userEvent.setup();

    const { unmount } = renderGallery();
    await user.click(screen.getByRole('button', { name: 'Favorite classic' }));
    await user.click(screen.getByRole('button', { name: 'Favorites only' }));
    unmount();

    renderGallery();

    expect(screen.getByRole('button', { name: 'Favorites only' })).toHaveAttribute(
      'aria-pressed',
      'true'
    );
    expect(screen.getAllByRole('link')).toHaveLength(1);
    expect(screen.getByText(/Classic Sudoku/i)).toBeTruthy();
  });
});
