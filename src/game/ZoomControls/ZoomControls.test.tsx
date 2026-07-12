import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ZoomControls } from './ZoomControls';

describe('ZoomControls', () => {
  it('should call the matching handler for each control', async () => {
    const onZoomIn = vi.fn();
    const onZoomOut = vi.fn();
    const onFit = vi.fn();
    const user = userEvent.setup();

    render(<ZoomControls onZoomIn={onZoomIn} onZoomOut={onZoomOut} onFit={onFit} />);

    await user.click(screen.getByRole('button', { name: 'Zoom in' }));
    await user.click(screen.getByRole('button', { name: 'Zoom out' }));
    await user.click(screen.getByRole('button', { name: 'Fit whole board' }));

    expect(onZoomIn).toHaveBeenCalledTimes(1);
    expect(onZoomOut).toHaveBeenCalledTimes(1);
    expect(onFit).toHaveBeenCalledTimes(1);
  });
});
