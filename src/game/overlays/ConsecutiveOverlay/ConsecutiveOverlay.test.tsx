import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { Variant } from '@/engine/types';
import type { Mark } from '@/engine/constraints/consecutive';
import { gridLayout } from '@/game/layouts/grid';
import { ConsecutiveOverlay } from './ConsecutiveOverlay';

const variant: Variant = {
  id: 'consecutive',
  name: 'Consecutive Sudoku',
  description: 'Test variant.',
  difficulty: 'intermediate',
  layout: { kind: 'grid', size: 9, box: { rows: 3, cols: 3 } },
  symbols: [1, 2, 3, 4, 5, 6, 7, 8, 9],
  constraintIds: ['uniqueness', 'consecutive'],
};

const rects = gridLayout.cellRects(variant);

describe('ConsecutiveOverlay', () => {
  it('should render an SVG element when marks are provided', () => {
    const marks: Mark[] = [{ a: 'r0c0', b: 'r0c1' }];

    render(<ConsecutiveOverlay rects={rects} structure={{ marks }} />);

    expect(screen.getByTestId('consecutive-overlay')).toBeTruthy();
  });

  it('should render one circle per mark', () => {
    const marks: Mark[] = [
      { a: 'r0c0', b: 'r0c1' },
      { a: 'r1c0', b: 'r2c0' },
    ];

    render(<ConsecutiveOverlay rects={rects} structure={{ marks }} />);

    expect(screen.getAllByTestId('consecutive-dot')).toHaveLength(2);
  });

  it('should render nothing when marks is empty', () => {
    render(<ConsecutiveOverlay rects={rects} structure={{ marks: [] }} />);

    expect(screen.queryByTestId('consecutive-dot')).toBeNull();
  });

  it('should be a no-op when structure has no marks field', () => {
    render(<ConsecutiveOverlay rects={rects} structure={{}} />);

    expect(screen.queryByTestId('consecutive-dot')).toBeNull();
  });
});
