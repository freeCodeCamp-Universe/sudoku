import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Modal } from '@/learn/base/Modal/Modal';

function Harness({ onClose }: { onClose?: () => void } = {}) {
  const [open, setOpen] = useState(false);
  const close = () => {
    onClose?.();
    setOpen(false);
  };

  return (
    <>
      <button type="button" onClick={() => setOpen(true)}>
        open modal
      </button>
      <Modal
        open={open}
        onClose={close}
        closeLabel="close modal"
        ariaLabelledBy="modal-title"
        panelClassName="panel"
      >
        <Modal.Header id="modal-title">Example modal</Modal.Header>
        <button type="button" aria-disabled="true">
          Disabled action
        </button>
        <button type="button" onClick={close} aria-label="close action">
          Close
        </button>
        <a href="/example">Example link</a>
      </Modal>
    </>
  );
}

function ExternalTriggerHarness() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button type="button" onClick={() => setOpen(true)}>
        real trigger
      </button>
      <button type="button">decoy</button>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        closeLabel="close modal"
        ariaLabelledBy="ext-title"
        panelClassName="panel"
        triggerElement={document.querySelector<HTMLElement>('[data-testid="ext-target"]')}
      >
        <Modal.Header id="ext-title">External trigger modal</Modal.Header>
      </Modal>
    </>
  );
}

describe('Modal', () => {
  it('should render nothing while closed', () => {
    render(<Harness />);

    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('should render its children and move focus to the first focusable element', async () => {
    const user = userEvent.setup();
    render(<Harness />);

    await user.click(screen.getByRole('button', { name: 'open modal' }));

    expect(screen.getByRole('dialog', { name: 'Example modal' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'close modal' })).toHaveFocus();
  });

  it('should close from Escape and restore focus to the trigger', async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();
    render(<Harness onClose={onClose} />);

    const trigger = screen.getByRole('button', { name: 'open modal' });
    await user.click(trigger);
    await user.keyboard('{Escape}');

    expect(onClose).toHaveBeenCalledOnce();
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    expect(trigger).toHaveFocus();
  });

  it('should close when the backdrop is clicked', async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();
    render(<Harness onClose={onClose} />);

    await user.click(screen.getByRole('button', { name: 'open modal' }));
    await user.click(screen.getByTestId('modal-backdrop'));

    expect(onClose).toHaveBeenCalledOnce();
  });

  it('should lock scrolling, make the background inert, and trap focus while open', async () => {
    const background = document.createElement('div');
    background.setAttribute('data-testid', 'background');
    document.body.appendChild(background);

    const user = userEvent.setup();
    render(<Harness />);
    await user.click(screen.getByRole('button', { name: 'open modal' }));

    const close = screen.getByRole('button', { name: 'close modal' });
    const link = screen.getByRole('link', { name: 'Example link' });
    expect(document.body.style.overflow).toBe('hidden');
    expect(background).toHaveAttribute('inert');

    await user.keyboard('{Shift>}{Tab}{/Shift}');
    expect(link).toHaveFocus();
    await user.keyboard('{Tab}');
    expect(close).toHaveFocus();

    await user.click(close);
    expect(document.body.style.overflow).toBe('');
    expect(background).not.toHaveAttribute('inert');
    background.remove();
  });

  it('should restore focus to the triggerElement prop instead of the self-captured activeElement', async () => {
    const externalTarget = document.createElement('button');
    externalTarget.textContent = 'external target';
    externalTarget.setAttribute('data-testid', 'ext-target');
    document.body.appendChild(externalTarget);

    const user = userEvent.setup();
    render(<ExternalTriggerHarness />);

    // Click "real trigger" to open the modal. document.activeElement is now
    // "real trigger", but the triggerElement prop points at externalTarget.
    await user.click(screen.getByRole('button', { name: 'real trigger' }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    await user.keyboard('{Escape}');

    // Focus should land on externalTarget (the prop), not "real trigger" (activeElement at open time).
    expect(externalTarget).toHaveFocus();

    externalTarget.remove();
  });

  it('should keep content mounted without activating modal behavior when requested', async () => {
    function KeepMountedHarness() {
      const [open, setOpen] = useState(true);
      return (
        <>
          <button type="button" onClick={() => setOpen(true)}>
            trigger
          </button>
          <Modal
            open={open}
            onClose={() => setOpen(false)}
            closeLabel="close modal"
            ariaLabelledBy="kept-title"
            keepMounted
          >
            <Modal.Header id="kept-title">Kept modal</Modal.Header>
            <button type="button">Close</button>
          </Modal>
          <button type="button" onClick={() => setOpen(false)}>
            hide modal
          </button>
        </>
      );
    }

    const user = userEvent.setup();
    render(<KeepMountedHarness />);
    await user.click(screen.getByRole('button', { name: 'hide modal' }));

    expect(screen.getByRole('dialog', { name: 'Kept modal' })).toBeInTheDocument();
    expect(document.body.style.overflow).toBe('');
  });
});
