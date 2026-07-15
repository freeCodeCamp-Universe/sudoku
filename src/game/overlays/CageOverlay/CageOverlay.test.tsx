import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { Variant } from '@/engine/types';
import type { Cage } from '@/game/gameTypes';
import { gridLayout } from '@/game/layouts/grid';
import {
  CAGE_RING,
  CAGE_RING_INSET_RATIO,
  CAGE_SUM_LABEL_CHAR_WIDTH,
  CAGE_SUM_LABEL_HEIGHT,
  CAGE_SUM_LABEL_PADDING,
  CAGE_SUM_LABEL_X_OFFSET,
} from '@/game/layouts/cellSizes';
import { CageOverlay } from './CageOverlay';

const variant: Variant = {
  id: 'killer',
  name: 'Killer Sudoku',
  description: 'Test variant.',
  popularity: 0,
  difficulty: 'intermediate',
  layout: { kind: 'grid', size: 9, box: { rows: 3, cols: 3 }, cellSize: 'spacious' },
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

  it('should inset cage lines from the cell edge based on the spacious ring', () => {
    render(<CageOverlay rects={rects} structure={{ cages }} />);

    const expectedInset = CAGE_RING * CAGE_RING_INSET_RATIO;
    const verticalBoundary = screen
      .getAllByTestId('cage-line')
      .find((line) => line.getAttribute('x1') === String(68 * 2 - expectedInset));

    expect(verticalBoundary).toHaveAttribute('x2', String(68 * 2 - expectedInset));
    expect(verticalBoundary).toHaveAttribute('y1', String(expectedInset));
    expect(verticalBoundary).toHaveAttribute('y2', String(68 - expectedInset));
  });

  it('should center the sum label and knockout on the cage line in the ring', () => {
    render(<CageOverlay rects={rects} structure={{ cages }} />);

    const label = screen.getAllByTestId('cage-sum-label')[0];
    const knockout = screen.getAllByTestId('cage-sum-knockout')[0];
    const expectedInset = CAGE_RING * CAGE_RING_INSET_RATIO;
    const expectedX = expectedInset + CAGE_SUM_LABEL_X_OFFSET;
    const expectedY = expectedInset;

    expect(label).toHaveAttribute('x', String(expectedX));
    expect(label).toHaveAttribute('y', String(expectedY));
    expect(knockout).toHaveAttribute('x', String(expectedX - CAGE_SUM_LABEL_PADDING / 2));
    expect(knockout).toHaveAttribute('y', String(expectedY - CAGE_SUM_LABEL_HEIGHT / 2));
    expect(knockout).toHaveAttribute(
      'width',
      String('7'.length * CAGE_SUM_LABEL_CHAR_WIDTH + CAGE_SUM_LABEL_PADDING)
    );
    expect(knockout).toHaveAttribute('height', String(CAGE_SUM_LABEL_HEIGHT));
  });

  it('should render nothing when cages list is empty', () => {
    render(<CageOverlay rects={rects} structure={{ cages: [] }} />);

    expect(screen.queryAllByTestId('cage-sum-label')).toHaveLength(0);
  });
});
