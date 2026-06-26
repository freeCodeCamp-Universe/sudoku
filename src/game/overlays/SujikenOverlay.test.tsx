import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { triangularLayout } from '@/game/layouts/triangular';
import { sujiken } from '@/variants/sujiken';
import { SujikenOverlay } from './SujikenOverlay';

const rects = triangularLayout.cellRects(sujiken);

describe('SujikenOverlay', () => {
  it('should render without crashing', () => {
    render(<SujikenOverlay rects={rects} />);

    expect(screen.getByTestId('sujiken-overlay')).toBeTruthy();
  });

  it('should render exactly 4 region border lines', () => {
    render(<SujikenOverlay rects={rects} />);

    expect(screen.getAllByTestId('region-line')).toHaveLength(4);
  });

  it('should render the outer triangular border path starting at the top-left corner', () => {
    render(<SujikenOverlay rects={rects} />);

    const path = screen.getByTestId('outer-border');

    expect(path.getAttribute('d')).toMatch(/^M 0,0/);
  });

  it('should have overflow visible so outer edges are not clipped', () => {
    render(<SujikenOverlay rects={rects} />);

    const svg = screen.getByTestId('sujiken-overlay');

    expect(svg.getAttribute('overflow')).toBe('visible');
  });
});
