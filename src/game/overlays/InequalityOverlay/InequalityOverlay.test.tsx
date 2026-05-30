import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { Variant } from '@/engine/types';
import type { Relation } from '@/engine/constraints/greaterThan';
import { gridLayout } from '@/game/layouts/grid';
import { InequalityOverlay } from './InequalityOverlay';

const variant: Variant = {
  id: 'greater-than',
  name: 'Greater-Than Sudoku',
  difficulty: 'intermediate',
  layout: { kind: 'grid', size: 9, box: { rows: 3, cols: 3 } },
  symbols: [1, 2, 3, 4, 5, 6, 7, 8, 9],
  constraintIds: ['uniqueness', 'greaterThan'],
};

const rects = gridLayout.cellRects(variant);

describe('InequalityOverlay', () => {
  it('should render an SVG element', () => {
    const relations: Relation[] = [{ greater: 'r0c0', lesser: 'r0c1' }];

    render(<InequalityOverlay rects={rects} structure={{ relations }} />);

    expect(screen.getByTestId('inequality-overlay')).toBeTruthy();
  });

  it('should render one polygon per relation', () => {
    const relations: Relation[] = [
      { greater: 'r0c0', lesser: 'r0c1' },
      { greater: 'r1c0', lesser: 'r2c0' },
    ];

    render(<InequalityOverlay rects={rects} structure={{ relations }} />);

    expect(screen.getAllByTestId('inequality-marker')).toHaveLength(2);
  });

  it('should render nothing when relations is empty', () => {
    render(<InequalityOverlay rects={rects} structure={{ relations: [] }} />);

    expect(screen.queryByTestId('inequality-marker')).toBeNull();
  });

  it('should be a no-op when structure has no relations field', () => {
    render(<InequalityOverlay rects={rects} structure={{}} />);

    expect(screen.queryByTestId('inequality-marker')).toBeNull();
  });
});
