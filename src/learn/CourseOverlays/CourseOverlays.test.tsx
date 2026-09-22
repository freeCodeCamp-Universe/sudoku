import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { courseChrome } from '@/learn/stores/courseChromeStore';
import { CourseOverlays } from '@/learn/CourseOverlays/CourseOverlays';
import { ThemeProvider } from '@/app/ThemeProvider';

vi.mock('@/learn/curriculum/useCurriculumTree', () => ({
  useCurriculumTree: () => ({ modules: [], orderedLessonIds: [] }),
}));

afterEach(() => {
  localStorage.clear();
  courseChrome.reset();
});

describe('CourseOverlays', () => {
  function renderOverlays() {
    return render(
      <ThemeProvider>
        <CourseOverlays />
      </ThemeProvider>
    );
  }

  it('should render neither overlay while the store is closed', () => {
    renderOverlays();

    expect(screen.queryByRole('dialog', { name: 'Lessons' })).toBeNull();
    expect(screen.queryByRole('dialog', { name: 'Keyboard shortcuts' })).toBeNull();
    expect(screen.queryByRole('dialog', { name: 'Settings' })).toBeNull();
  });

  it('should open the drawer when the store opens it (as the header button does)', () => {
    renderOverlays();

    act(() => {
      courseChrome.openDrawer();
    });

    expect(screen.getByRole('dialog', { name: 'Lessons' })).toBeInTheDocument();
  });

  it('should open the shortcuts modal when the store opens it', () => {
    renderOverlays();

    act(() => {
      courseChrome.openShortcuts();
    });

    expect(screen.getByRole('dialog', { name: 'Keyboard Shortcuts' })).toBeInTheDocument();
  });

  it('should restore focus to the element that was focused when the drawer opened', async () => {
    const trigger = document.createElement('button');
    trigger.textContent = 'external trigger';
    document.body.appendChild(trigger);
    trigger.focus();

    const user = userEvent.setup();
    renderOverlays();

    act(() => {
      courseChrome.openDrawer();
    });

    expect(screen.getByRole('dialog', { name: 'Lessons' })).toBeInTheDocument();

    await user.keyboard('{Escape}');

    expect(trigger).toHaveFocus();
    trigger.remove();
  });

  it('should restore focus to the element that was focused when the shortcuts modal opened', async () => {
    const trigger = document.createElement('button');
    trigger.textContent = 'external trigger';
    document.body.appendChild(trigger);
    trigger.focus();

    const user = userEvent.setup();
    renderOverlays();

    act(() => {
      courseChrome.openShortcuts();
    });

    expect(screen.getByRole('dialog', { name: 'Keyboard Shortcuts' })).toBeInTheDocument();

    await user.keyboard('{Escape}');

    expect(trigger).toHaveFocus();
    trigger.remove();
  });

  it('should not render settings as a course overlay', () => {
    renderOverlays();

    act(() => {
      courseChrome.openSettings();
    });

    expect(screen.queryByRole('dialog', { name: 'Settings' })).not.toBeInTheDocument();
  });
});
