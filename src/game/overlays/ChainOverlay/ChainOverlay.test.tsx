import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { Variant } from '@/engine/types';
import type { Chain } from '@/engine/constraints/chain';
import { gridLayout } from '@/game/layouts/grid';
import { ChainOverlay } from './ChainOverlay';

const variant: Variant = {
  id: 'chain',
  name: 'Chain Sudoku',
  description: 'Test variant.',
  popularity: 0,
  difficulty: 'advanced',
  layout: { kind: 'grid', size: 9, box: { rows: 3, cols: 3 } },
  symbols: [1, 2, 3, 4, 5, 6, 7, 8, 9],
  constraintIds: ['uniqueness', 'chain'],
};

const rects = gridLayout.cellRects(variant);

describe('ChainOverlay', () => {
  it('should render an SVG element when chains are provided', () => {
    const chains: Chain[] = [{ cells: ['r0c1', 'r1c1', 'r1c2'], color: '#99c9ff' }];

    render(<ChainOverlay rects={rects} structure={{ chains }} />);

    expect(screen.getByTestId('chain-overlay')).toBeTruthy();
  });

  it('should render one polyline per chain', () => {
    const chains: Chain[] = [
      { cells: ['r0c1', 'r1c1', 'r1c2'], color: '#99c9ff' },
      { cells: ['r3c0', 'r4c0', 'r4c1'], color: '#acd157' },
    ];

    render(<ChainOverlay rects={rects} structure={{ chains }} />);

    expect(screen.getAllByTestId('chain-line')).toHaveLength(2);
  });

  it('should set the stroke color from the chain color', () => {
    const chains: Chain[] = [{ cells: ['r0c1', 'r1c1'], color: '#f1be32' }];

    render(<ChainOverlay rects={rects} structure={{ chains }} />);

    expect(screen.getByTestId('chain-line').getAttribute('stroke')).toBe('#f1be32');
  });

  it('should render nothing when chains array is empty', () => {
    render(<ChainOverlay rects={rects} structure={{ chains: [] }} />);

    expect(screen.queryByTestId('chain-line')).toBeNull();
  });

  it('should be a no-op when structure has no chains field', () => {
    render(<ChainOverlay rects={rects} structure={{}} />);

    expect(screen.queryByTestId('chain-line')).toBeNull();
  });
});
