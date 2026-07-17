import { useState } from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { ToastItem } from './ToastStack';
import { ToastStack } from './ToastStack';

// Every item gets a `content` distinct from its `message` (as real callers
// have: rich visible markup, plain announcement text) so text queries can
// target the visible toast and the live region separately.
const first: ToastItem = { id: 1, message: 'First announced', content: 'First body' };
const second: ToastItem = { id: 2, message: 'Second announced', content: 'Second body' };

// Owns the toast list the way a real caller does: dismissal removes the toast,
// and the push button appends a fresh one.
function Harness({ initial, next }: { initial: ToastItem[]; next?: ToastItem }) {
  const [toasts, setToasts] = useState(initial);

  return (
    <>
      {next ? (
        <button type="button" onClick={() => setToasts((current) => [...current, next])}>
          Push
        </button>
      ) : null}
      <ToastStack
        toasts={toasts}
        onDismiss={(id) => setToasts((current) => current.filter((toast) => toast.id !== id))}
      />
    </>
  );
}

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('ToastStack', () => {
  it('should render one toast with a dismiss button per item', () => {
    render(<Harness initial={[first, second]} />);

    expect(screen.getByText('First body')).toBeInTheDocument();
    expect(screen.getByText('Second body')).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: 'Dismiss' })).toHaveLength(2);
  });

  it('should show the newest toast on top, pushing older ones down', () => {
    render(<Harness initial={[first]} next={second} />);

    fireEvent.click(screen.getByRole('button', { name: 'Push' }));

    const bodies = screen.getAllByText(/body$/);
    expect(bodies.map((element) => element.textContent)).toEqual(['Second body', 'First body']);
  });

  it('should fall back to the message as visible content when no content is given', () => {
    render(<Harness initial={[{ id: 1, message: 'Plain toast' }]} />);

    // Both the visible copy and the live region carry the message text.
    expect(screen.getAllByText('Plain toast')).toHaveLength(2);
  });

  it('should announce the newest toast in a status region that stays mounted', () => {
    render(<Harness initial={[first]} next={second} />);

    const region = screen.getByRole('status');
    expect(region).toHaveTextContent('First announced');

    fireEvent.click(screen.getByRole('button', { name: 'Push' }));
    expect(region).toHaveTextContent('Second announced');

    // Dismiss both; the region must stay in the DOM with its text cleared so
    // the next announcement lands in an already-mounted live region (screen
    // readers skip regions that enter the DOM with content already in them).
    for (const dismiss of screen.getAllByRole('button', { name: 'Dismiss' })) {
      fireEvent.click(dismiss);
    }
    act(() => {
      vi.advanceTimersByTime(200);
    });

    expect(region).toBeInTheDocument();
    expect(region.textContent).toBe('');
  });

  it('should not re-announce an older toast when a newer one is dismissed', () => {
    render(<Harness initial={[first, second]} />);

    // Newest toast renders first, so its dismiss button comes first.
    const [dismissSecond] = screen.getAllByRole('button', { name: 'Dismiss' });
    fireEvent.click(dismissSecond);
    act(() => {
      vi.advanceTimersByTime(200);
    });

    expect(screen.getByText('First body')).toBeInTheDocument();
    // The region keeps the newest announcement rather than flipping back to
    // the older toast, which would speak it a second time.
    expect(screen.getByRole('status')).toHaveTextContent('Second announced');
  });

  it('should auto-dismiss a toast after the duration plus the exit transition', () => {
    render(<Harness initial={[first]} />);

    act(() => {
      vi.advanceTimersByTime(6000);
    });
    act(() => {
      vi.advanceTimersByTime(200);
    });

    expect(screen.queryByText('First body')).toBeNull();
  });

  it('should pause the auto-dismiss countdown while hovered and restart it on leave', () => {
    render(<Harness initial={[first]} />);

    // Hovering any part of the toast (here its dismiss button) pauses it;
    // mouseOver/mouseOut are what React derives enter/leave events from, and
    // they bubble to the toast's handler where mouseEnter would not.
    fireEvent.mouseOver(screen.getByRole('button', { name: 'Dismiss' }));
    act(() => {
      vi.advanceTimersByTime(60000);
    });
    expect(screen.getByText('First body')).toBeInTheDocument();

    fireEvent.mouseOut(screen.getByRole('button', { name: 'Dismiss' }));
    act(() => {
      vi.advanceTimersByTime(6000);
    });
    act(() => {
      vi.advanceTimersByTime(200);
    });
    expect(screen.queryByText('First body')).toBeNull();
  });

  it('should pause the auto-dismiss countdown while the dismiss button has focus', () => {
    render(<Harness initial={[first]} />);

    const dismiss = screen.getByRole('button', { name: 'Dismiss' });
    fireEvent.focus(dismiss);
    act(() => {
      vi.advanceTimersByTime(60000);
    });
    expect(screen.getByText('First body')).toBeInTheDocument();

    fireEvent.blur(dismiss);
    act(() => {
      vi.advanceTimersByTime(6000);
    });
    act(() => {
      vi.advanceTimersByTime(200);
    });
    expect(screen.queryByText('First body')).toBeNull();
  });

  it('should run an independent countdown per toast', () => {
    render(<Harness initial={[first]} next={second} />);

    act(() => {
      vi.advanceTimersByTime(5000);
    });
    fireEvent.click(screen.getByRole('button', { name: 'Push' }));

    // The first toast expires on its own schedule (1s + exit later) while the
    // second sticks around for its full duration.
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    act(() => {
      vi.advanceTimersByTime(200);
    });
    expect(screen.queryByText('First body')).toBeNull();
    expect(screen.getByText('Second body')).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(4800);
    });
    act(() => {
      vi.advanceTimersByTime(200);
    });
    expect(screen.queryByText('Second body')).toBeNull();
  });
});
