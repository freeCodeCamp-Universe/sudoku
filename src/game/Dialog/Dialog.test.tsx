import { useState } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Dialog } from './Dialog';

// The single-close contract only holds when a real parent owns `open`: a
// dismissal flips `open` to false, and the effect-driven `close()` must not
// re-run side effects. This harness models that parent so the tests exercise
// the real path rather than a static `open` prop.
function Harness({
  onClose,
  title = 'Test dialog',
  showCloseX,
  closeOnBackdrop,
}: {
  onClose: () => void;
  title?: string;
  showCloseX?: boolean;
  closeOnBackdrop?: boolean;
}) {
  const [open, setOpen] = useState(true);
  return (
    <>
      <button type="button" onClick={() => setOpen(false)}>
        close from parent
      </button>
      <Dialog
        open={open}
        onClose={() => {
          setOpen(false);
          onClose();
        }}
        title={title}
        showCloseX={showCloseX}
        closeOnBackdrop={closeOnBackdrop}
      >
        <p>Body content</p>
      </Dialog>
    </>
  );
}

describe('Dialog', () => {
  it('should close and fire onClose once when Escape is pressed', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();

    render(<Harness onClose={onClose} />);
    expect(screen.getByRole('dialog', { name: 'Test dialog' })).toBeTruthy();

    await user.keyboard('{Escape}');

    expect(screen.queryByRole('dialog')).toBeNull();
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('should close and fire onClose once when the close button is clicked', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();

    render(<Harness onClose={onClose} />);
    await user.click(screen.getByRole('button', { name: 'Close' }));

    expect(screen.queryByRole('dialog')).toBeNull();
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('should close and fire onClose once when the backdrop is clicked', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();

    render(<Harness onClose={onClose} />);
    await user.click(screen.getByRole('dialog', { name: 'Test dialog' }));

    expect(screen.queryByRole('dialog')).toBeNull();
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('should fire onClose once when the parent closes it programmatically', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();

    render(<Harness onClose={onClose} />);
    await user.click(screen.getByRole('button', { name: 'close from parent' }));

    expect(screen.queryByRole('dialog')).toBeNull();
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('should not render a close button when showCloseX is false', () => {
    render(<Harness onClose={vi.fn()} showCloseX={false} />);

    expect(screen.queryByRole('button', { name: 'Close' })).toBeNull();
  });

  it('should not close on backdrop click when closeOnBackdrop is false', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();

    render(<Harness onClose={onClose} closeOnBackdrop={false} />);
    await user.click(screen.getByRole('dialog', { name: 'Test dialog' }));

    expect(screen.getByRole('dialog')).toBeTruthy();
    expect(onClose).not.toHaveBeenCalled();
  });

  it('should expose an accessible name via the title prop', () => {
    render(
      <Dialog open onClose={vi.fn()} title="Named by title">
        <p>Body</p>
      </Dialog>
    );

    const dialog = screen.getByRole('dialog', { name: 'Named by title' });
    const title = screen.getByRole('heading', { name: 'Named by title', level: 2 });
    expect(dialog).toHaveAccessibleName('Named by title');
    expect(title.id).toBe(dialog.getAttribute('aria-labelledby'));
  });

  it('should move forward through every focusable element in order via Tab', async () => {
    const user = userEvent.setup();
    render(
      <Dialog open onClose={vi.fn()} title="Multi-button dialog">
        <button type="button">First action</button>
        <button type="button">Last action</button>
      </Dialog>
    );

    // The jsdom `showModal()` polyfill does not auto-focus on open (real
    // browsers do), so seed the starting point explicitly.
    screen.getByRole('button', { name: 'Close' }).focus();
    await user.tab();
    expect(screen.getByRole('button', { name: 'First action' })).toHaveFocus();
    await user.tab();
    expect(screen.getByRole('button', { name: 'Last action' })).toHaveFocus();
  });

  it('should recover to the first focusable element if Tab is pressed while focus is somewhere the dialog does not track (e.g. a browser focus quirk)', () => {
    render(
      <Dialog open onClose={vi.fn()} title="Multi-button dialog">
        <button type="button">First action</button>
        <button type="button">Last action</button>
      </Dialog>
    );

    // Simulates the real WebKit bug this guards against: native Tab handling
    // there lands focus on the <dialog> element itself rather than any of
    // its buttons, so our own handler can't assume the browser's Tab
    // landed on a tracked element -- it must still recover sensibly.
    const dialog = screen.getByRole('dialog', { name: 'Multi-button dialog' });
    dialog.focus();
    fireEvent.keyDown(dialog, { key: 'Tab' });

    expect(screen.getByRole('button', { name: 'Close' })).toHaveFocus();
  });

  it('should wrap Tab from the last focusable element back to the first, without landing on body', async () => {
    const user = userEvent.setup();
    render(
      <Dialog open onClose={vi.fn()} title="Multi-button dialog">
        <button type="button">First action</button>
        <button type="button">Last action</button>
      </Dialog>
    );

    // Focus order: close (x) -> First action -> Last action -> wraps to close (x).
    screen.getByRole('button', { name: 'Last action' }).focus();
    await user.tab();

    expect(screen.getByRole('button', { name: 'Close' })).toHaveFocus();
  });

  it('should wrap Shift+Tab from the first focusable element back to the last, without landing on body', async () => {
    const user = userEvent.setup();
    render(
      <Dialog open onClose={vi.fn()} title="Multi-button dialog">
        <button type="button">First action</button>
        <button type="button">Last action</button>
      </Dialog>
    );

    screen.getByRole('button', { name: 'Close' }).focus();
    await user.tab({ shift: true });

    expect(screen.getByRole('button', { name: 'Last action' })).toHaveFocus();
  });

  it('should expose an accessible name via the labelledBy prop with caller-owned markup', () => {
    render(
      <Dialog open onClose={vi.fn()} labelledBy="custom-title">
        <h2 id="custom-title">Named by children</h2>
        <p>Body</p>
      </Dialog>
    );

    const dialog = screen.getByRole('dialog', { name: 'Named by children' });
    expect(dialog).toHaveAccessibleName('Named by children');
    expect(dialog.getAttribute('aria-labelledby')).toBe('custom-title');
  });
});
