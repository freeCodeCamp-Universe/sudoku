import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import type { Variant } from '@/engine/types';
import { VariantCard } from './VariantCard';

vi.mock('@/gallery/previews', () => ({
  Preview: ({ variantId }: { variantId: string }) => (
    <div data-testid="preview">preview:{variantId}</div>
  ),
}));

const classicVariant: Variant = {
  id: 'classic',
  name: 'Classic Sudoku',
  description: 'Test variant.',
  popularity: 1,
  difficulty: 'intermediate',
  layout: { kind: 'grid', size: 9, box: { rows: 3, cols: 3 } },
  symbols: [1, 2, 3, 4, 5, 6, 7, 8, 9],
  constraintIds: ['uniqueness'],
};

function renderCard(props: Partial<Parameters<typeof VariantCard>[0]> = {}) {
  return render(
    <MemoryRouter>
      <VariantCard
        variant={classicVariant}
        isFavorite={false}
        onToggleFavorite={() => {}}
        {...props}
      />
    </MemoryRouter>
  );
}

describe('VariantCard', () => {
  it('should render the variant name as a heading', () => {
    renderCard();

    expect(screen.getByRole('heading', { name: 'Classic Sudoku', level: 3 })).toBeTruthy();
  });

  it('should render the difficulty badge', () => {
    renderCard();

    expect(screen.getByText('Intermediate')).toBeTruthy();
  });

  it('should link to /:variantId', () => {
    renderCard();

    expect(screen.getByRole('link')).toHaveAttribute('href', '/classic');
  });

  it('should render a Preview', () => {
    renderCard();

    expect(screen.getByTestId('preview')).toHaveTextContent('preview:classic');
  });

  it('should render an unpressed favorite button when not favorited', () => {
    renderCard();

    const button = screen.getByRole('button', { name: 'Add Classic Sudoku to favorites' });
    expect(button).toHaveAttribute('aria-pressed', 'false');
  });

  it('should render a pressed favorite button when favorited', () => {
    renderCard({ isFavorite: true });

    const button = screen.getByRole('button', { name: 'Remove Classic Sudoku from favorites' });
    expect(button).toHaveAttribute('aria-pressed', 'true');
  });

  it('should call onToggleFavorite with the variant id when the star is clicked', async () => {
    const user = userEvent.setup();
    const onToggleFavorite = vi.fn();
    renderCard({ onToggleFavorite });

    await user.click(screen.getByRole('button', { name: 'Add Classic Sudoku to favorites' }));

    expect(onToggleFavorite).toHaveBeenCalledWith('classic');
  });
});
