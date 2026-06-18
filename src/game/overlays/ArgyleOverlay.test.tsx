import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { describe, expect, it } from 'vitest';
import { gridLayout } from '@/game/layouts/grid';
import { argyle } from '@/variants/argyle';
import { ArgyleOverlay } from './ArgyleOverlay';

const rects = gridLayout.cellRects(argyle);

describe('ArgyleOverlay', () => {
  it('should render without crashing', () => {
    render(<ArgyleOverlay rects={rects} structure={undefined} />);

    expect(screen.getByTestId('argyle-overlay')).toBeInTheDocument();
  });

  it('should render lines for the D1 group', () => {
    render(<ArgyleOverlay rects={rects} structure={undefined} />);

    expect(screen.getAllByTestId('argyle-d1-line').length).toBeGreaterThan(0);
  });

  it('should render lines for the D2 group', () => {
    render(<ArgyleOverlay rects={rects} structure={undefined} />);

    expect(screen.getAllByTestId('argyle-d2-line').length).toBeGreaterThan(0);
  });
});
