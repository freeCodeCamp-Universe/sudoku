import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { Variant } from '@/engine/types';
import type { KropkiMark } from '@/engine/constraints/kropki';
import { gridLayout } from '@/game/layouts/grid';
import { KropkiOverlay } from './KropkiOverlay';

const variant: Variant = {
  id: 'kropki',
  name: 'Kropki Sudoku',
  description: 'Test variant.',
  popularity: 0,
  difficulty: 'intermediate',
  layout: { kind: 'grid', size: 9, box: { rows: 3, cols: 3 } },
  symbols: [1, 2, 3, 4, 5, 6, 7, 8, 9],
  constraintIds: ['uniqueness', 'kropki'],
};

const rects = gridLayout.cellRects(variant);

describe('KropkiOverlay', () => {
  it('should render an SVG element when marks are provided', () => {
    const kropkiMarks: KropkiMark[] = [{ a: 'r0c0', b: 'r0c1', kind: 'black' }];

    render(<KropkiOverlay rects={rects} structure={{ kropkiMarks }} />);

    expect(screen.getByTestId('kropki-overlay')).toBeTruthy();
  });

  it('should render a black dot for a black mark and a white dot for a white mark', () => {
    const kropkiMarks: KropkiMark[] = [
      { a: 'r0c0', b: 'r0c1', kind: 'black' },
      { a: 'r1c0', b: 'r1c1', kind: 'white' },
    ];

    render(<KropkiOverlay rects={rects} structure={{ kropkiMarks }} />);

    expect(screen.getByTestId('kropki-black-dot')).toBeTruthy();
    expect(screen.getByTestId('kropki-white-dot')).toBeTruthy();
  });

  it('should place a dot for both horizontal and vertical adjacency', () => {
    const kropkiMarks: KropkiMark[] = [
      { a: 'r0c0', b: 'r0c1', kind: 'black' },
      { a: 'r0c0', b: 'r1c0', kind: 'white' },
    ];

    render(<KropkiOverlay rects={rects} structure={{ kropkiMarks }} />);

    expect(screen.getAllByTestId(/kropki-(black|white)-dot/)).toHaveLength(2);
  });

  it('should skip a mark whose cells are not orthogonally adjacent', () => {
    const kropkiMarks: KropkiMark[] = [{ a: 'r0c0', b: 'r1c1', kind: 'black' }];

    render(<KropkiOverlay rects={rects} structure={{ kropkiMarks }} />);

    expect(screen.queryByTestId('kropki-black-dot')).toBeNull();
  });

  it('should render nothing when marks is empty', () => {
    render(<KropkiOverlay rects={rects} structure={{ kropkiMarks: [] }} />);

    expect(screen.queryByTestId('kropki-overlay')).toBeNull();
  });

  it('should be a no-op when structure has no kropkiMarks field', () => {
    render(<KropkiOverlay rects={rects} structure={{}} />);

    expect(screen.queryByTestId('kropki-overlay')).toBeNull();
  });
});
