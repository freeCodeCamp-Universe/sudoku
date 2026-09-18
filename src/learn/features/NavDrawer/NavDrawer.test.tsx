import { useState } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactElement } from 'react';
import { Router } from 'react-router-dom';
import { memoryLocation } from 'react-router-dom';
import { progressStore } from '@/learn/stores/progressStore';
import { NavDrawer } from '@/learn/features/NavDrawer/NavDrawer';

const modules = [
  {
    slug: 'modes',
    title: 'Modes and quitting',
    lessons: [
      { id: 'l1', title: 'Enter insert mode' },
      { id: 'l2', title: 'Save and quit' },
    ],
  },
  {
    slug: 'navigation',
    title: 'Moving around',
    lessons: [
      { id: 'l3', title: 'Word motions' },
      { id: 'l4', title: 'Jump to line' },
    ],
  },
];

const STORAGE_KEY = 'sudoku:learn:progress';

function setProgress(completed: string[]) {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      completed: completed.map((id, index) => ({ id, completedAt: index })),
    })
  );
  progressStore.reset();
}

function renderWithRouter(ui: ReactElement) {
  const { hook } = memoryLocation({ path: '/', record: true });
  return render(<Router hook={hook}>{ui}</Router>);
}

/** Harness with a real trigger so focus move/restore is observable. */
function Harness({
  onClose,
  currentLessonId,
}: { onClose?: () => void; currentLessonId?: string } = {}) {
  const [open, setOpen] = useState(false);
  const close = () => {
    onClose?.();
    setOpen(false);
  };
  return (
    <>
      <button type="button" onClick={() => setOpen(true)}>
        open lessons
      </button>
      <NavDrawer open={open} onClose={close} modules={modules} currentLessonId={currentLessonId} />
    </>
  );
}

afterEach(() => {
  localStorage.clear();
  progressStore.reset();
});

describe('NavDrawer', () => {
  it('should render nothing while closed', () => {
    renderWithRouter(<Harness />);

    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('should mark the open lesson as current and completed lessons, every row is a link', async () => {
    setProgress(['l1']);
    const user = userEvent.setup();
    renderWithRouter(<Harness currentLessonId="l3" />);

    await user.click(screen.getByRole('button', { name: 'open lessons' }));

    expect(screen.getByText('1/4 lessons completed')).toHaveAttribute('aria-hidden', 'true');
    expect(screen.getByText('1 out of 4 lessons completed')).toHaveClass('sr-only');
    expect(
      within(screen.getByRole('dialog')).getByText('1/4 lessons completed')
    ).toBeInTheDocument();

    const completed = screen.getByRole('link', { name: /Enter insert mode/ });
    expect(completed).toHaveAttribute('href', '/learn/l1');
    expect(within(completed).getByText('Completed')).toBeInTheDocument();

    const current = screen.getByRole('link', { name: /Word motions/ });
    expect(current).toHaveAttribute('href', '/learn/l3');
    expect(current).toHaveAttribute('aria-current', 'step');
    expect(within(current).queryByText('current')).toBeNull();

    // Later lessons are navigable, not locked.
    expect(screen.getByRole('link', { name: /Save and quit/ })).toHaveAttribute(
      'href',
      '/learn/l2'
    );
    expect(screen.queryByText('locked')).toBeNull();
  });

  it('should keep the open lesson current after it is completed', async () => {
    setProgress(['l1']);
    const user = userEvent.setup();
    renderWithRouter(<Harness currentLessonId="l1" />);

    await user.click(screen.getByRole('button', { name: 'open lessons' }));

    const current = screen.getByRole('link', { name: /Enter insert mode/ });
    expect(current).toHaveAttribute('aria-current', 'step');
    expect(within(current).getByText('Completed')).toBeInTheDocument();
  });

  it('should focus the current lesson link when the drawer opens', async () => {
    const user = userEvent.setup();
    renderWithRouter(<Harness currentLessonId="l3" />);

    await user.click(screen.getByRole('button', { name: 'open lessons' }));

    const current = screen.getByRole('link', { name: /Word motions/ });
    expect(current).toHaveFocus();
  });

  it('should focus the close button when there is no current lesson', async () => {
    const user = userEvent.setup();
    renderWithRouter(<Harness />);

    await user.click(screen.getByRole('button', { name: 'open lessons' }));

    expect(screen.getByRole('button', { name: 'close' })).toHaveFocus();
  });

  it('should close when a reachable lesson is selected', async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();
    renderWithRouter(<Harness onClose={onClose} />);

    await user.click(screen.getByRole('button', { name: 'open lessons' }));
    await user.click(screen.getByRole('link', { name: /Enter insert mode/ }));

    expect(onClose).toHaveBeenCalledOnce();
  });

  it('should clear the search query when the drawer closes', async () => {
    const user = userEvent.setup();
    renderWithRouter(<Harness />);

    await user.click(screen.getByRole('button', { name: 'open lessons' }));
    await user.type(screen.getByRole('searchbox'), 'word');
    expect(screen.getByRole('searchbox')).toHaveValue('word');

    await user.click(screen.getByRole('button', { name: 'close' }));
    await user.click(screen.getByRole('button', { name: 'open lessons' }));

    expect(screen.getByRole('searchbox')).toHaveValue('');
  });
});
