import { render, screen } from '@testing-library/react';
import { createRef } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { BoardViewport } from './BoardViewport';
import styles from './BoardViewport.module.css';

function makeViewport(animated = false) {
  return {
    transform: { scale: 1.5, translateX: -20, translateY: -30 },
    animated,
    viewportRef: createRef<HTMLDivElement>(),
    onPointerDown: vi.fn(),
    onPointerMove: vi.fn(),
    onPointerUp: vi.fn(),
  };
}

describe('BoardViewport', () => {
  it('should render its children inside a transformed wrapper', () => {
    render(
      <BoardViewport viewport={makeViewport()}>
        <div>board</div>
      </BoardViewport>
    );
    const wrapper = screen.getByTestId('board-viewport-content');
    expect(wrapper.style.transform).toBe('translate(-20px, -30px) scale(1.5)');
  });

  it('should ease the transform only for programmatic (animated) moves', () => {
    const { rerender } = render(
      <BoardViewport viewport={makeViewport(true)}>
        <div>board</div>
      </BoardViewport>
    );
    const wrapper = screen.getByTestId('board-viewport-content');
    expect(wrapper).toHaveClass(styles.contentAnimated);

    rerender(
      <BoardViewport viewport={makeViewport(false)}>
        <div>board</div>
      </BoardViewport>
    );
    expect(wrapper).not.toHaveClass(styles.contentAnimated);
  });
});
