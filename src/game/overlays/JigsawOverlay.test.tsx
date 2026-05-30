import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { gridLayout } from '@/game/layouts/grid';
import type { JigsawStructure } from '@/variants/jigsaw';
import { jigsaw, PRESET_LAYOUTS } from '@/variants/jigsaw';
import { JigsawOverlay } from './JigsawOverlay';

const rects = gridLayout.cellRects(jigsaw);
const structure: JigsawStructure = { regions: PRESET_LAYOUTS[0] };

describe('JigsawOverlay', () => {
  it('should render without crashing', () => {
    render(<JigsawOverlay rects={rects} structure={structure} />);

    expect(screen.getByTestId('jigsaw-overlay')).toBeTruthy();
  });

  it('should render region border lines', () => {
    render(<JigsawOverlay rects={rects} structure={structure} />);

    expect(screen.getAllByTestId('region-border').length).toBeGreaterThan(0);
  });
});
