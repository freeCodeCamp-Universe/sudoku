import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { gridLayout } from '@/game/layouts/grid';
import { asterisk } from '@/variants/asterisk';
import { AsteriskOverlay } from './AsteriskOverlay';

const rects = gridLayout.cellRects(asterisk);

describe('AsteriskOverlay', () => {
  it('should render without crashing', () => {
    render(<AsteriskOverlay rects={rects} structure={undefined} />);

    expect(screen.getByTestId('asterisk-overlay')).toBeTruthy();
  });

  it('should render nine shaded asterisk cells', () => {
    render(<AsteriskOverlay rects={rects} structure={undefined} />);

    expect(screen.getAllByTestId('asterisk-cell')).toHaveLength(9);
  });
});
