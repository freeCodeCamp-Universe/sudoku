/* eslint-disable testing-library/no-node-access */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import type { ReactElement } from 'react';
import { MemoryRouter } from 'react-router-dom';
import { progressStore } from '@/learn/stores/progressStore';
import { CurriculumOverview } from '@/learn/CurriculumOverview/CurriculumOverview';

const modules = [
  {
    slug: 'modes',
    title: 'Modes',
    lessons: [
      { id: 'l1', title: 'Enter insert mode' },
      { id: 'l2', title: 'Save and quit' },
      { id: 'l3', title: 'Normal mode basics' },
    ],
  },
];

const orderedLessonIds = ['l1', 'l2', 'l3'];

function renderWithRouter(ui: ReactElement) {
  return render(<MemoryRouter>{ui}</MemoryRouter>);
}

vi.mock('@/curriculum/useCurriculumTree', () => ({
  useCurriculumTree: () => ({ modules, orderedLessonIds }),
}));

afterEach(() => {
  localStorage.clear();
  progressStore.reset();
});

describe('CurriculumOverview', () => {
  it('should render completion state from the shared progress storage', () => {
    localStorage.setItem(
      'sudoku:learn:progress',
      JSON.stringify({ completed: [{ id: 'l1', completedAt: 1000 }] })
    );
    progressStore.reset();

    renderWithRouter(<CurriculumOverview />);

    const completedLink = screen.getByRole('link', { name: /Enter insert mode/ });
    const completedItem = completedLink.closest('[data-lesson-id]');
    expect(completedItem).toHaveAttribute('data-state', 'completed');
    expect(within(completedLink).getByText('Completed')).toBeInTheDocument();
    expect(screen.getByText('1/3 lessons completed')).toHaveAttribute('aria-hidden', 'true');
    expect(screen.getByText('1 out of 3 lessons completed')).toHaveClass('sr-only');
  });

  it('should show "Start learning" linking to the first lesson when no progress exists', () => {
    renderWithRouter(<CurriculumOverview />);

    const btn = screen.getByRole('link', { name: 'Start learning' });
    expect(btn).toHaveAttribute('href', '/learn/l1');
  });

  it('should show "Continue" linking to the lesson after the most recently completed one', () => {
    localStorage.setItem(
      'sudoku:learn:progress',
      JSON.stringify({ completed: [{ id: 'l1', completedAt: 1000 }] })
    );
    progressStore.reset();

    renderWithRouter(<CurriculumOverview />);

    const btn = screen.getByRole('link', { name: 'Continue' });
    expect(btn).toHaveAttribute('href', '/learn/l2');
  });

  it('should link "Continue" based on highest timestamp, not array position', () => {
    // l3 completed first (ts=1000), l1 completed last (ts=2000) → lastCompleted=l1 → link to l2
    localStorage.setItem(
      'sudoku:learn:progress',
      JSON.stringify({
        completed: [
          { id: 'l3', completedAt: 1000 },
          { id: 'l1', completedAt: 2000 },
        ],
      })
    );
    progressStore.reset();

    renderWithRouter(<CurriculumOverview />);

    const btn = screen.getByRole('link', { name: 'Continue' });
    expect(btn).toHaveAttribute('href', '/learn/l2');
  });

  it('should fall back to the frontier when the last completed lesson is the final one but gaps exist', () => {
    // User completed l1 (ts=1000) and l3 (ts=2000, the final lesson) but skipped l2.
    // lastCompletedId=l3 → orderedLessonIds[3] is undefined → frontier=l2.
    localStorage.setItem(
      'sudoku:learn:progress',
      JSON.stringify({
        completed: [
          { id: 'l1', completedAt: 1000 },
          { id: 'l3', completedAt: 2000 },
        ],
      })
    );
    progressStore.reset();

    renderWithRouter(<CurriculumOverview />);

    const btn = screen.getByRole('link', { name: 'Continue' });
    expect(btn).toHaveAttribute('href', '/learn/l2');
  });

  it('should hide the CTA button when all lessons are completed', () => {
    localStorage.setItem(
      'sudoku:learn:progress',
      JSON.stringify({
        completed: [
          { id: 'l1', completedAt: 1000 },
          { id: 'l2', completedAt: 2000 },
          { id: 'l3', completedAt: 3000 },
        ],
      })
    );
    progressStore.reset();

    renderWithRouter(<CurriculumOverview />);

    expect(screen.queryByRole('link', { name: 'Continue' })).toBeNull();
    expect(screen.queryByRole('link', { name: 'Start learning' })).toBeNull();
  });

  it('should fall back to the frontier when the last completed lesson is no longer in the curriculum', () => {
    // 'l-unknown' is not in orderedLessonIds; frontier is the first uncompleted (l1)
    localStorage.setItem(
      'sudoku:learn:progress',
      JSON.stringify({
        completed: [{ id: 'l-unknown', completedAt: 1000 }],
      })
    );
    progressStore.reset();

    renderWithRouter(<CurriculumOverview />);

    const btn = screen.getByRole('link', { name: 'Continue' });
    expect(btn).toHaveAttribute('href', '/learn/l1');
  });
});
