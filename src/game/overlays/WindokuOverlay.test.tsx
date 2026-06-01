import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { gridLayout } from '@/game/layouts/grid';
import { windoku } from '@/variants/windoku';
import { WindokuOverlay } from './WindokuOverlay';

const rects = gridLayout.cellRects(windoku);

describe('WindokuOverlay', () => {
  it('should render without crashing', () => {
    render(<WindokuOverlay rects={rects} structure={undefined} />);

    expect(screen.getByTestId('windoku-overlay')).toBeTruthy();
  });

  it('should render four shaded window regions', () => {
    render(<WindokuOverlay rects={rects} structure={undefined} />);

    expect(screen.getAllByTestId('windoku-window')).toHaveLength(4);
  });
});
