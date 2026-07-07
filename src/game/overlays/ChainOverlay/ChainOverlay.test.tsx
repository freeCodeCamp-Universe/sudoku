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
    const chains: Chain[] = [{ cells: ['r0c1', 'r1c1', 'r1c2'] }];

    render(<ChainOverlay rects={rects} structure={{ chains }} />);

    expect(screen.getByTestId('chain-overlay')).toBeTruthy();
  });

  it('should render one polyline per chain', () => {
    const chains: Chain[] = [
      { cells: ['r0c1', 'r1c1', 'r1c2'] },
      { cells: ['r3c0', 'r4c0', 'r4c1'] },
    ];

    render(<ChainOverlay rects={rects} structure={{ chains }} />);

    expect(screen.getAllByTestId('chain-line')).toHaveLength(2);
  });

  it('should stroke each chain with its indexed theme token', () => {
    const chains: Chain[] = [{ cells: ['r0c1', 'r1c1'] }, { cells: ['r3c0', 'r4c0'] }];

    render(<ChainOverlay rects={rects} structure={{ chains }} />);

    const lines = screen.getAllByTestId('chain-line');
    expect(lines[0].getAttribute('stroke')).toBe('var(--overlay-chain-1)');
    expect(lines[1].getAttribute('stroke')).toBe('var(--overlay-chain-2)');
  });

  it('should wrap the stroke token past twelve chains', () => {
    const chains: Chain[] = Array.from({ length: 13 }, (_, i) => ({
      cells: [`r${i % 9}c${Math.floor(i / 9)}`] as Chain['cells'],
    }));

    render(<ChainOverlay rects={rects} structure={{ chains }} />);

    const lines = screen.getAllByTestId('chain-line');
    expect(lines[12].getAttribute('stroke')).toBe('var(--overlay-chain-1)');
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
