/* eslint-disable testing-library/no-node-access */
import { describe, expect, it, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactElement } from 'react';
import { MemoryRouter } from 'react-router-dom';
import {
  CurriculumTree,
  type CurriculumTreeLessonState,
  type CurriculumTreeModule,
} from '@/learn/CurriculumTree/CurriculumTree';

const modules: CurriculumTreeModule[] = [
  {
    slug: 'modes',
    title: 'Modes and quitting',
    lessons: [
      { id: 'l1', title: 'Enter `insert` mode' },
      { id: 'l2', title: 'Save and quit' },
    ],
  },
  {
    slug: 'navigation',
    title: 'Moving around',
    lessons: [{ id: 'l3', title: 'Word motions' }],
  },
];

function renderWithRouter(ui: ReactElement) {
  return render(<MemoryRouter>{ui}</MemoryRouter>);
}

describe('CurriculumTree', () => {
  it('should render the same curriculum structure for the home variant', () => {
    renderWithRouter(<CurriculumTree modules={modules} variant="home" />);

    expect(screen.getByRole('heading', { name: /Modes and quitting/ }).tagName).toBe('H2');
    expect(screen.getByRole('heading', { name: /Moving around/ }).tagName).toBe('H2');
    expect(screen.getByRole('link', { name: /Enter insert mode/ })).toHaveAttribute(
      'href',
      '/learn/l1'
    );
    expect(screen.getByText('insert')).toBeInTheDocument();
    expect(screen.getAllByRole('link')).toHaveLength(3);
  });

  it('should number modules sequentially when no display numbers are provided', () => {
    renderWithRouter(<CurriculumTree modules={modules} variant="home" />);

    const headings = screen.getAllByRole('heading');

    expect(headings[0]).toHaveTextContent(/^1\. Modes and quitting$/);
    expect(headings[1]).toHaveTextContent(/^2\. Moving around$/);
  });

  it('should render drawer headings and lesson state metadata', () => {
    const states: Record<string, CurriculumTreeLessonState> = {
      l1: 'completed',
      l2: 'current',
      l3: 'available',
    };

    renderWithRouter(
      <CurriculumTree modules={modules} variant="drawer" lessonState={(id) => states[id]} />
    );

    expect(screen.getByRole('heading', { name: /Modes and quitting/ }).tagName).toBe('H3');

    const completed = screen.getByRole('link', { name: /Enter insert mode/ });
    expect(completed.closest('[data-lesson-id]')).toHaveAttribute('data-state', 'completed');
    expect(within(completed).getByText('Completed')).toBeInTheDocument();
    expect(completed.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');

    const current = screen.getByRole('link', { name: /Save and quit/ });
    expect(current).toHaveAttribute('aria-current', 'step');
    expect(current.closest('[data-lesson-id]')).toHaveAttribute('data-state', 'current');
    expect(within(current).queryByText('current')).toBeNull();

    const available = screen.getByRole('link', { name: /Word motions/ });
    expect(available.closest('[data-lesson-id]')).toHaveAttribute('data-state', 'available');
    expect(within(available).getByText('Not completed')).toBeInTheDocument();
    expect(available.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
  });

  it('should call the lesson click handler when a lesson is selected', async () => {
    const onLessonClick = vi.fn();
    const user = userEvent.setup();
    renderWithRouter(
      <CurriculumTree modules={modules} variant="drawer" onLessonClick={onLessonClick} />
    );

    await user.click(screen.getByRole('link', { name: /Save and quit/ }));

    expect(onLessonClick).toHaveBeenCalledOnce();
  });
});
