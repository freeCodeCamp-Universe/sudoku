import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Toolbar } from './Toolbar';

const baseProps = {
  candidateMode: false,
  checkEnabled: true,
  timerEnabled: true,
  onUndo: vi.fn(),
  onErase: vi.fn(),
  onToggleCandidateMode: vi.fn(),
  onToggleCheck: vi.fn(),
  onToggleTimer: vi.fn(),
  onReveal: vi.fn(),
  onNewGame: vi.fn(),
};

describe('Toolbar', () => {
  it('should render Undo, Erase, Reveal Cell, and New Game buttons', () => {
    render(<Toolbar {...baseProps} />);

    expect(screen.getByRole('button', { name: /undo/i })).toBeTruthy();
    expect(screen.getByRole('button', { name: /erase/i })).toBeTruthy();
    expect(screen.getByRole('button', { name: /reveal/i })).toBeTruthy();
    expect(screen.getByRole('button', { name: /new game/i })).toBeTruthy();
  });

  it('should call onUndo when the Undo button is clicked', async () => {
    const user = userEvent.setup();
    const onUndo = vi.fn();

    render(<Toolbar {...baseProps} onUndo={onUndo} />);
    await user.click(screen.getByRole('button', { name: /undo/i }));

    expect(onUndo).toHaveBeenCalledTimes(1);
  });

  it('should show a confirmation dialog when New Game is clicked with hasProgress=true', async () => {
    const user = userEvent.setup();

    render(<Toolbar {...baseProps} hasProgress />);
    await user.click(screen.getByRole('button', { name: /new game/i }));

    expect(screen.getByRole('dialog')).toBeTruthy();
  });

  it('should call onNewGame directly when New Game is clicked with hasProgress=false', async () => {
    const user = userEvent.setup();
    const onNewGame = vi.fn();

    render(<Toolbar {...baseProps} onNewGame={onNewGame} hasProgress={false} />);
    await user.click(screen.getByRole('button', { name: /new game/i }));

    expect(onNewGame).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('should toggle candidateMode display', () => {
    const { rerender } = render(<Toolbar {...baseProps} candidateMode={false} />);
    rerender(<Toolbar {...baseProps} candidateMode />);

    expect(screen.getByRole('button', { name: 'Candidate' })).toHaveAttribute('data-active', 'true');
  });
});
