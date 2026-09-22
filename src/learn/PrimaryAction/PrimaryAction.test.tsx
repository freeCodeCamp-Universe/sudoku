import { afterEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import styles from '@/components/Button/Button.module.css';
import { SHORTCUTS_STORAGE_KEY } from '@/learn/hooks/useShortcutsPreference';
import { PrimaryAction, type PrimaryActionProps } from '@/learn/PrimaryAction/PrimaryAction';

afterEach(() => {
  localStorage.clear();
});

function renderAction(props: Partial<PrimaryActionProps> = {}) {
  const onAdvance = vi.fn();
  const onBlocked = vi.fn();
  render(<PrimaryAction complete={false} onAdvance={onAdvance} onBlocked={onBlocked} {...props} />);
  return { onAdvance, onBlocked };
}

describe('PrimaryAction', () => {
  it('should hide the action while the lesson is unfinished', () => {
    const { onAdvance, onBlocked } = renderAction({ complete: false });

    expect(screen.queryByRole('button', { name: /next/i })).not.toBeInTheDocument();
    expect(onBlocked).not.toHaveBeenCalled();
    expect(onAdvance).not.toHaveBeenCalled();
  });

  it('should advance a completed lesson', async () => {
    const user = userEvent.setup();
    const { onAdvance, onBlocked } = renderAction({ complete: true });

    expect(screen.getByRole('button', { name: /next/i })).toHaveClass(styles.cta);
    await user.click(screen.getByRole('button', { name: /next/i }));
    expect(onAdvance).toHaveBeenCalledOnce();
    expect(onBlocked).not.toHaveBeenCalled();
  });

  it('should label a completed capstone "finish course"', async () => {
    const user = userEvent.setup();
    const { onAdvance } = renderAction({ complete: true, isCapstone: true });

    await user.click(screen.getByRole('button', { name: /finish/i }));
    expect(onAdvance).toHaveBeenCalledOnce();
  });

  it('should advance a lesson with no checklist to block on', async () => {
    const user = userEvent.setup();
    const { onAdvance } = renderAction({ complete: true, onBlocked: undefined });

    await user.click(screen.getByRole('button', { name: /next/i }));
    expect(onAdvance).toHaveBeenCalledOnce();
  });

  it('should trigger the control with Cmd/Ctrl+Enter regardless of focus', async () => {
    const user = userEvent.setup();
    const { onAdvance } = renderAction({ complete: true });

    await user.keyboard('{Meta>}{Enter}{/Meta}');
    await user.keyboard('{Control>}{Enter}{/Control}');
    expect(onAdvance).toHaveBeenCalledTimes(2);
  });

  it('should not fire the shortcut when keyboard shortcuts are disabled', async () => {
    localStorage.setItem(SHORTCUTS_STORAGE_KEY, 'false');
    const user = userEvent.setup();
    const { onAdvance, onBlocked } = renderAction({ complete: true });

    await user.keyboard('{Meta>}{Enter}{/Meta}');
    expect(onAdvance).not.toHaveBeenCalled();
    expect(onBlocked).not.toHaveBeenCalled();
  });

  it('should report an unfinished lesson from the shortcut rather than advancing', async () => {
    const user = userEvent.setup();
    const { onAdvance, onBlocked } = renderAction({ complete: false });

    await user.keyboard('{Meta>}{Enter}{/Meta}');
    expect(onBlocked).toHaveBeenCalledOnce();
    expect(onAdvance).not.toHaveBeenCalled();
  });
});
