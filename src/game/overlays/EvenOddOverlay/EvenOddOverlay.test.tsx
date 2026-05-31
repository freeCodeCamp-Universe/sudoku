import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { gridLayout } from '@/game/layouts/grid';
import type { Variant } from '@/engine/types';
import { EvenOddOverlay } from './EvenOddOverlay';

const variant: Variant = {
  id: 'even-odd',
  name: 'Even-Odd Sudoku',
  description: 'Test variant.',
  popularity: 0,
  difficulty: 'intermediate',
  layout: { kind: 'grid', size: 9, box: { rows: 3, cols: 3 } },
  symbols: [1, 2, 3, 4, 5, 6, 7, 8, 9],
  constraintIds: ['uniqueness', 'evenOdd'],
};

const rects = gridLayout.cellRects(variant);

describe('EvenOddOverlay', () => {
  it('should render even-shaded elements for even-parity cells', () => {
    const parityMap = new Map([['r0c0', 0 as 0 | 1], ['r0c1', 1 as 0 | 1]]);
    render(<EvenOddOverlay rects={rects} structure={{ parityMap }} />);

    expect(screen.getAllByTestId('parity-even')).toHaveLength(1);
    expect(screen.getAllByTestId('parity-odd')).toHaveLength(1);
  });

  it('should render nothing when parityMap is empty', () => {
    render(<EvenOddOverlay rects={rects} structure={{ parityMap: new Map() }} />);

    expect(screen.queryByTestId('parity-even')).toBeNull();
    expect(screen.queryByTestId('parity-odd')).toBeNull();
  });
});
