import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { Variant } from '@/engine/types';
import type { Arrow } from '@/game/gameTypes';
import { gridLayout } from '@/game/layouts/grid';
import { ArrowOverlay } from './ArrowOverlay';

const variant: Variant = {
  id: 'arrow',
  name: 'Arrow Sudoku',
  description: 'Test variant.',
  difficulty: 'intermediate',
  layout: { kind: 'grid', size: 9, box: { rows: 3, cols: 3 } },
  symbols: [1, 2, 3, 4, 5, 6, 7, 8, 9],
  constraintIds: ['uniqueness', 'arrowSum'],
};

const rects = gridLayout.cellRects(variant);
const arrows: Arrow[] = [
  { bulb: 'r0c0', path: ['r0c1', 'r0c2'] },
  { bulb: 'r2c2', path: ['r3c3', 'r4c4'] },
];

describe('ArrowOverlay', () => {
  it('should render an SVG element', () => {
    render(<ArrowOverlay rects={rects} structure={{ arrows }} />);

    expect(screen.getByTestId('arrow-overlay')).toBeTruthy();
  });

  it('should render one circle per arrow bulb', () => {
    render(<ArrowOverlay rects={rects} structure={{ arrows }} />);

    expect(screen.getAllByTestId('arrow-circle')).toHaveLength(2);
  });

  it('should render one polyline per arrow', () => {
    render(<ArrowOverlay rects={rects} structure={{ arrows }} />);

    expect(screen.getAllByTestId('arrow-path-line')).toHaveLength(2);
  });

  it('should render nothing when arrows list is empty', () => {
    render(<ArrowOverlay rects={rects} structure={{ arrows: [] }} />);

    expect(screen.queryAllByTestId('arrow-circle')).toHaveLength(0);
  });
});
