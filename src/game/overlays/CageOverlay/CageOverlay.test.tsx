import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { Variant } from '@/engine/types';
import type { Cage } from '@/game/gameTypes';
import { gridLayout } from '@/game/layouts/grid';
import { CageOverlay } from './CageOverlay';

const variant: Variant = {
  id: 'killer',
  name: 'Killer Sudoku',
  description: 'Test variant.',
  popularity: 0,
  difficulty: 'intermediate',
  layout: { kind: 'grid', size: 9, box: { rows: 3, cols: 3 } },
  symbols: [1, 2, 3, 4, 5, 6, 7, 8, 9],
  constraintIds: ['uniqueness', 'cageSum'],
};

const rects = gridLayout.cellRects(variant);
const cages: Cage[] = [
  { cells: ['r0c0', 'r0c1'], sum: 7 },
  { cells: ['r1c0', 'r2c0'], sum: 5 },
];

describe('CageOverlay', () => {
  it('should render an SVG element', () => {
    render(<CageOverlay rects={rects} structure={{ cages }} />);

    expect(screen.getByTestId('cage-overlay')).toBeTruthy();
  });

  it('should render one sum label per cage', () => {
    render(<CageOverlay rects={rects} structure={{ cages }} />);

    expect(screen.getAllByText('7')).toHaveLength(1);
    expect(screen.getAllByText('5')).toHaveLength(1);
  });

  it('should render nothing when cages list is empty', () => {
    render(<CageOverlay rects={rects} structure={{ cages: [] }} />);

    expect(screen.queryAllByTestId('cage-sum-label')).toHaveLength(0);
  });
});
