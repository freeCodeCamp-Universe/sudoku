import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { gridLayout } from '@/game/layouts/grid';
import { centerDot } from '@/variants/centerDot';
import { CenterDotOverlay } from './CenterDotOverlay';

const rects = gridLayout.cellRects(centerDot);

describe('CenterDotOverlay', () => {
  it('should render without crashing', () => {
    render(<CenterDotOverlay rects={rects} structure={undefined} />);

    expect(screen.getByTestId('center-dot-overlay')).toBeTruthy();
  });

  it('should render nine dots', () => {
    render(<CenterDotOverlay rects={rects} structure={undefined} />);

    expect(screen.getAllByTestId('center-dot-cell')).toHaveLength(9);
  });
});
