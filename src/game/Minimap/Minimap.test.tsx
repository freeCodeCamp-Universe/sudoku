import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { CellId } from '@/engine/types';
import type { Rect } from '@/game/gameTypes';
import { Minimap } from './Minimap';

const rects = new Map<CellId, Rect>([
  ['r0c0' as CellId, { x: 0, y: 0, w: 40, h: 40 }],
  ['r0c1' as CellId, { x: 40, y: 0, w: 40, h: 40 }],
]);

const baseProps = {
  rects,
  filled: new Set<CellId>(['r0c0' as CellId]),
  board: { w: 840, h: 840 },
  viewport: { w: 360, h: 360 },
  origin: { x: 0, y: 0 },
  transform: { scale: 1, translateX: 0, translateY: 0 },
};

describe('Minimap', () => {
  it('should expose an accessible name', () => {
    render(<Minimap {...baseProps} onSeek={vi.fn()} />);
    expect(screen.getByRole('img', { name: /board overview/i })).toBeInTheDocument();
  });

  it('should call onSeek when clicked', async () => {
    const onSeek = vi.fn();
    const user = userEvent.setup();
    render(<Minimap {...baseProps} onSeek={onSeek} />);
    await user.click(screen.getByRole('img', { name: /board overview/i }));
    expect(onSeek).toHaveBeenCalled();
  });
});
