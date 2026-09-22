import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Drawer } from '@/learn/Drawer/Drawer';
import styles from '@/learn/Drawer/Drawer.module.css';

function Harness({ onClose }: { onClose?: () => void }) {
  const [open, setOpen] = useState(false);
  const close = () => {
    onClose?.();
    setOpen(false);
  };
  return (
    <>
      <button type="button" onClick={() => setOpen(true)}>
        open
      </button>
      <Drawer open={open} onClose={close} title="Test drawer">
        <Drawer.Body>
          <p>drawer content</p>
        </Drawer.Body>
      </Drawer>
    </>
  );
}

describe('Drawer', () => {
  it('should render nothing while closed', () => {
    render(<Harness />);

    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('should show the title and content when open', async () => {
    const user = userEvent.setup();
    render(<Harness />);

    await user.click(screen.getByRole('button', { name: 'open' }));

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Test drawer')).toBeInTheDocument();
    expect(screen.getByText('drawer content')).toBeInTheDocument();
  });

  it('should slide from the bottom when requested', () => {
    render(
      <Drawer open onClose={() => {}} title="Bottom drawer" slideFrom="bottom">
        <Drawer.Body>
          <p>drawer content</p>
        </Drawer.Body>
      </Drawer>
    );

    expect(screen.getByRole('dialog')).toHaveClass(styles.panel, styles['panel-bottom']);
  });

  it('should slide from the end when requested', () => {
    render(
      <Drawer open onClose={() => {}} title="End drawer" slideFrom="end">
        <Drawer.Body>
          <p>drawer content</p>
        </Drawer.Body>
      </Drawer>
    );

    expect(screen.getByRole('dialog')).toHaveClass(styles.panel, styles['panel-end']);
  });

  it('should slide from the start by default', () => {
    render(
      <Drawer open onClose={() => {}} title="Start drawer">
        <Drawer.Body>
          <p>drawer content</p>
        </Drawer.Body>
      </Drawer>
    );

    expect(screen.getByRole('dialog')).toHaveClass(styles.panel);
    expect(screen.getByRole('dialog')).not.toHaveClass(styles['panel-bottom']);
  });

  it('should render header content below the title row', () => {
    render(
      <>
        <button type="button" onClick={() => {}}>
          open
        </button>
        <Drawer
          open
          onClose={() => {}}
          title="Test drawer"
          headerContent={<input aria-label="Search lessons" />}
        >
          <Drawer.Body>
            <p>drawer content</p>
          </Drawer.Body>
        </Drawer>
      </>
    );

    expect(screen.getByRole('heading', { name: 'Test drawer' })).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: 'Search lessons' })).toBeInTheDocument();
  });

  it('should close when the close button is clicked', async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();
    render(<Harness onClose={onClose} />);

    await user.click(screen.getByRole('button', { name: 'open' }));
    await user.click(screen.getByRole('button', { name: 'close' }));

    expect(onClose).toHaveBeenCalledOnce();
  });

  it('should close on Escape', async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();
    render(<Harness onClose={onClose} />);

    await user.click(screen.getByRole('button', { name: 'open' }));
    await user.keyboard('{Escape}');

    expect(onClose).toHaveBeenCalledOnce();
  });

  it('should unmount after the exit transition', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<Harness />);

    await user.click(screen.getByRole('button', { name: 'open' }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'close' }));

    // Dialog stays mounted during the transition
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(200);
    });

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).toBeNull();
    });

    vi.useRealTimers();
  });
});
