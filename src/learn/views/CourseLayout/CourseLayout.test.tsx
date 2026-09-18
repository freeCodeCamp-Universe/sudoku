import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { CourseLayout } from '@/learn/views/CourseLayout/CourseLayout';

vi.mock('@/learn/features/HeaderControls/HeaderControls', () => ({
  HeaderControls: ({
    showDrawer,
    showShortcuts,
  }: {
    showDrawer?: boolean;
    showShortcuts?: boolean;
  }) => (
    <div
      data-testid="header-controls"
      data-show-drawer={showDrawer}
      data-show-shortcuts={showShortcuts}
    />
  ),
}));

vi.mock('@/learn/features/CourseOverlays/CourseOverlays', () => ({
  CourseOverlays: ({ currentLessonId }: { currentLessonId?: string }) => (
    <div data-testid="course-overlays" data-current-lesson={currentLessonId ?? ''} />
  ),
}));

vi.mock('@/learn/hooks/useMediaQuery', () => ({
  useMediaQuery: () => false,
}));

describe('CourseLayout', () => {
  it('should provide the learn shell without lesson-only controls on the overview', () => {
    render(
      <MemoryRouter initialEntries={['/learn']}>
        <Routes>
          <Route
            path="/learn"
            element={
              <CourseLayout>
                <main id="main-content">Overview</main>
              </CourseLayout>
            }
          />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByRole('link', { name: 'Sudoku' })).toHaveAttribute('href', '/');
    expect(screen.getByText('Overview')).toBeInTheDocument();
    expect(screen.getByTestId('header-controls')).toHaveAttribute('data-show-drawer', 'false');
    expect(screen.getByTestId('header-controls')).toHaveAttribute('data-show-shortcuts', 'false');
    expect(screen.getByTestId('course-overlays')).toHaveAttribute('data-current-lesson', '');
  });

  it('should expose the current lesson to lesson-only shell controls', () => {
    render(
      <MemoryRouter initialEntries={['/learn/101']}>
        <Routes>
          <Route
            path="/learn/:lessonId"
            element={
              <CourseLayout>
                <main id="main-content">Lesson</main>
              </CourseLayout>
            }
          />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText('Lesson')).toBeInTheDocument();
    expect(screen.getByTestId('header-controls')).toHaveAttribute('data-show-drawer', 'true');
    expect(screen.getByTestId('header-controls')).toHaveAttribute('data-show-shortcuts', 'true');
    expect(screen.getByTestId('course-overlays')).toHaveAttribute('data-current-lesson', '101');
  });
});
