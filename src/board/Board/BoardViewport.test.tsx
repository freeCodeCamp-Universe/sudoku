import { render, screen } from '@testing-library/react';
import { createRef } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { BoardViewport } from './BoardViewport';
import styles from './BoardViewport.module.css';

function makeViewport({ active = true, animated = false } = {}) {
  return {
    active,
    transform: { scale: 1.5, translateX: -20, translateY: -30 },
    animated,
    viewportRef: createRef<HTMLDivElement>(),
    onPointerDown: vi.fn(),
    onPointerMove: vi.fn(),
    onPointerUp: vi.fn(),
  };
}

describe('BoardViewport', () => {
  it('should render inactive wrappers in passthrough mode', () => {
    render(
      <BoardViewport viewport={makeViewport({ active: false })}>
        <div>board</div>
      </BoardViewport>
    );
    const viewport = screen.getByTestId('board-viewport');
    const wrapper = screen.getByTestId('board-viewport-content');
    expect(viewport).toHaveClass(styles.passthrough);
    expect(wrapper).toHaveClass(styles.passthrough);
    expect(wrapper.style.transform).toBe('');
  });

  it('should apply the active transform and animated class', () => {
    const { rerender } = render(
      <BoardViewport viewport={makeViewport({ active: true, animated: true })}>
        <div>board</div>
      </BoardViewport>
    );
    const viewport = screen.getByTestId('board-viewport');
    const wrapper = screen.getByTestId('board-viewport-content');
    expect(wrapper.style.transform).toBe('translate(-20px, -30px) scale(1.5)');
    expect(wrapper).toHaveClass(styles.contentAnimated);
    expect(viewport).toHaveClass(styles.viewport);

    rerender(
      <BoardViewport viewport={makeViewport({ active: true, animated: false })}>
        <div>board</div>
      </BoardViewport>
    );
    expect(wrapper).not.toHaveClass(styles.contentAnimated);
  });
});
