import { render, screen } from '@testing-library/react';
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

describe('VariantCard', () => {
  it('should render the variant name', () => {
    render(
      <MemoryRouter>
        <VariantCard variant={classicVariant} />
      </MemoryRouter>
    );

    expect(screen.getByText('Classic Sudoku')).toBeTruthy();
  });

  it('should render the difficulty badge', () => {
    render(
      <MemoryRouter>
        <VariantCard variant={classicVariant} />
      </MemoryRouter>
    );

    expect(screen.getByText('Intermediate')).toBeTruthy();
  });

  it('should link to /:variantId', () => {
    render(
      <MemoryRouter>
        <VariantCard variant={classicVariant} />
      </MemoryRouter>
    );

    expect(screen.getByRole('link')).toHaveAttribute('href', '/classic');
  });

  it('should render a Preview', () => {
    render(
      <MemoryRouter>
        <VariantCard variant={classicVariant} />
      </MemoryRouter>
    );

    expect(screen.getByTestId('preview')).toHaveTextContent('preview:classic');
  });
});
