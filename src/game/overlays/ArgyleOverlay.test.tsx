import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { gridLayout } from '@/game/layouts/grid';
import { argyle } from '@/variants/argyle';
import { ArgyleOverlay } from './ArgyleOverlay';

const rects = gridLayout.cellRects(argyle);

describe('ArgyleOverlay', () => {
  it('should render without crashing', () => {
    render(<ArgyleOverlay rects={rects} structure={undefined} />);

    expect(screen.getByTestId('argyle-overlay')).toBeTruthy();
  });

  it('should render cells for the D1 group', () => {
    render(<ArgyleOverlay rects={rects} structure={undefined} />);

    expect(screen.getAllByTestId('argyle-d1-cell').length).toBeGreaterThan(0);
  });

  it('should render cells for the D2 group', () => {
    render(<ArgyleOverlay rects={rects} structure={undefined} />);

    expect(screen.getAllByTestId('argyle-d2-cell').length).toBeGreaterThan(0);
  });
});
