import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ResetButton } from '@/learn/ResetButton/ResetButton';

function mockMatchMedia(matches: boolean) {
  const mq = {
    matches,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  };
  vi.spyOn(window, 'matchMedia').mockReturnValue(mq as unknown as MediaQueryList);
  return mq;
}

describe('ResetButton — desktop (hover device)', () => {
  beforeEach(() => {
    mockMatchMedia(false);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should render the Reset button', () => {
    render(<ResetButton onReset={vi.fn()} />);

    expect(screen.getByRole('button', { name: /^reset$/i })).toBeEnabled();
  });

  it('should confirm before resetting', async () => {
    const user = userEvent.setup();
    const onReset = vi.fn();
    render(<ResetButton onReset={onReset} />);

    await user.click(screen.getByRole('button', { name: /^reset$/i }));
    expect(onReset).not.toHaveBeenCalled();

    const cancel = screen.getByRole('button', { name: /cancel/i });
    expect(cancel).toHaveFocus();
    const confirm = screen.getByRole('button', { name: /yes, reset/i });
    await user.click(confirm);
    expect(onReset).toHaveBeenCalledOnce();
  });

  it('should dismiss the inline confirm on cancel without resetting', async () => {
    const user = userEvent.setup();
    const onReset = vi.fn();
    render(<ResetButton onReset={onReset} />);

    await user.click(screen.getByRole('button', { name: /^reset$/i }));
    expect(screen.getByText('Reset this lesson?')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /cancel/i }));

    expect(onReset).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: /^reset$/i })).toHaveFocus();
  });

  it('should have no keyboard shortcut', async () => {
    const user = userEvent.setup();
    const onReset = vi.fn();
    render(<ResetButton onReset={onReset} />);

    await user.keyboard('{Meta>}{Enter}{/Meta}');
    await user.keyboard('{Control>}{Enter}{/Control}');
    expect(onReset).not.toHaveBeenCalled();
  });
});

describe('ResetButton — mobile (narrow touch device)', () => {
  beforeEach(() => {
    mockMatchMedia(true);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should render the Reset button', () => {
    render(<ResetButton onReset={vi.fn()} />);

    expect(screen.getByRole('button', { name: /^reset$/i })).toBeEnabled();
  });

  it('should open a drawer when Reset is clicked', async () => {
    const user = userEvent.setup();
    render(<ResetButton onReset={vi.fn()} />);

    await user.click(screen.getByRole('button', { name: /^reset$/i }));

    expect(screen.getByRole('dialog', { name: /confirm reset/i })).toBeInTheDocument();
    expect(screen.getByText('Reset your edits and progress in this lesson?')).toBeInTheDocument();
  });

  it('should focus Cancel when the drawer opens', async () => {
    const user = userEvent.setup();
    render(<ResetButton onReset={vi.fn()} />);

    await user.click(screen.getByRole('button', { name: /^reset$/i }));

    expect(screen.getByRole('button', { name: /cancel/i })).toHaveFocus();
  });

  it('should close the drawer on cancel without resetting', async () => {
    const user = userEvent.setup();
    const onReset = vi.fn();
    render(<ResetButton onReset={onReset} />);

    await user.click(screen.getByRole('button', { name: /^reset$/i }));
    await user.click(screen.getByRole('button', { name: /cancel/i }));

    expect(onReset).not.toHaveBeenCalled();
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).toBeNull();
    });
  });

  it('should reset and close the drawer when Yes, reset is clicked', async () => {
    const user = userEvent.setup();
    const onReset = vi.fn();
    render(<ResetButton onReset={onReset} />);

    await user.click(screen.getByRole('button', { name: /^reset$/i }));
    await user.click(screen.getByRole('button', { name: /yes, reset/i }));

    expect(onReset).toHaveBeenCalledOnce();
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).toBeNull();
    });
  });

  it('should not show the inline confirm text', async () => {
    const user = userEvent.setup();
    render(<ResetButton onReset={vi.fn()} />);

    await user.click(screen.getByRole('button', { name: /^reset$/i }));

    expect(screen.queryByText('Reset this lesson?')).toBeNull();
  });
});
