import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { CourseLayout } from '@/learn/CourseLayout/CourseLayout';
import styles from '@/components/Header/Header.module.css';

vi.mock('@/learn/HeaderControls/HeaderControls', () => ({
  HeaderControls: ({
    showDrawer,
    showShortcuts,
    showSettings,
    showThemeToggle,
    themeToggleDesktopOnly,
  }: {
    showDrawer?: boolean;
    showShortcuts?: boolean;
    showSettings?: boolean;
    showThemeToggle?: boolean;
    themeToggleDesktopOnly?: boolean;
  }) => (
    <div
      data-testid="header-controls"
      data-show-drawer={showDrawer}
      data-show-shortcuts={showShortcuts}
      data-show-settings={showSettings}
      data-show-theme-toggle={showThemeToggle}
      data-theme-toggle-desktop-only={themeToggleDesktopOnly}
    />
  ),
}));

vi.mock('@/learn/CourseOverlays/CourseOverlays', () => ({
  CourseOverlays: ({ currentLessonId }: { currentLessonId?: string }) => (
    <div data-testid="course-overlays" data-current-lesson={currentLessonId ?? ''} />
  ),
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

    expect(screen.getByRole('link', { name: 'Home' })).toHaveAttribute('href', '/');
    expect(screen.getByRole('link', { name: 'Home' })).toHaveClass(styles.backBtn);
    expect(screen.queryByRole('link', { name: 'Learn' })).not.toBeInTheDocument();
    expect(screen.getByText('Overview')).toBeInTheDocument();
    expect(screen.getByTestId('header-controls')).toHaveAttribute('data-show-drawer', 'false');
    expect(screen.getByTestId('header-controls')).toHaveAttribute('data-show-shortcuts', 'false');
    expect(screen.getByTestId('header-controls')).toHaveAttribute('data-show-settings', 'false');
    expect(screen.getByTestId('header-controls')).toHaveAttribute('data-show-theme-toggle', 'true');
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

    expect(screen.getByRole('link', { name: 'Home' })).toHaveAttribute('href', '/');
    const learnLink = screen.getByRole('link', { name: 'Learn' });
    expect(learnLink).toHaveAttribute('href', '/learn');
    expect(learnLink).toHaveClass(styles.backBtn, styles.learnNavLink);
    expect(screen.getByText('Lesson')).toBeInTheDocument();
    expect(screen.getByTestId('header-controls')).toHaveAttribute('data-show-drawer', 'true');
    expect(screen.getByTestId('header-controls')).toHaveAttribute('data-show-shortcuts', 'true');
    expect(screen.getByTestId('header-controls')).toHaveAttribute('data-show-settings', 'true');
    expect(screen.getByTestId('header-controls')).toHaveAttribute('data-show-theme-toggle', 'true');
    expect(screen.getByTestId('header-controls')).toHaveAttribute(
      'data-theme-toggle-desktop-only',
      'true'
    );
    expect(screen.getByTestId('course-overlays')).toHaveAttribute('data-current-lesson', '101');
  });
});
