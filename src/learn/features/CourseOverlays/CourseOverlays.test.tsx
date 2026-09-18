import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { courseChrome } from '@/learn/stores/courseChromeStore';
import { CourseOverlays } from '@/learn/features/CourseOverlays/CourseOverlays';

vi.mock('@/curriculum/useCurriculumTree', () => ({
  useCurriculumTree: () => ({ modules: [], orderedLessonIds: [] }),
}));

afterEach(() => {
  localStorage.clear();
  courseChrome.reset();
});

describe('CourseOverlays', () => {
  it('should render neither overlay while the store is closed', () => {
    render(<CourseOverlays />);

    expect(screen.queryByRole('dialog', { name: 'Lessons' })).toBeNull();
    expect(screen.queryByRole('dialog', { name: 'Keyboard shortcuts' })).toBeNull();
    expect(screen.queryByRole('dialog', { name: 'Settings' })).toBeNull();
  });

  it('should open the drawer when the store opens it (as the header button does)', () => {
    render(<CourseOverlays />);

    act(() => {
      courseChrome.openDrawer();
    });

    expect(screen.getByRole('dialog', { name: 'Lessons' })).toBeInTheDocument();
  });

  it('should open the shortcuts modal when the store opens it', () => {
    render(<CourseOverlays />);

    act(() => {
      courseChrome.openShortcuts();
    });

    expect(screen.getByRole('dialog', { name: 'Keyboard shortcuts' })).toBeInTheDocument();
  });

  it('should restore focus to the element that was focused when the drawer opened', async () => {
    const trigger = document.createElement('button');
    trigger.textContent = 'external trigger';
    document.body.appendChild(trigger);
    trigger.focus();

    const user = userEvent.setup();
    render(<CourseOverlays />);

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
    render(<CourseOverlays />);

    act(() => {
      courseChrome.openShortcuts();
    });

    expect(screen.getByRole('dialog', { name: 'Keyboard shortcuts' })).toBeInTheDocument();

    await user.keyboard('{Escape}');

    expect(trigger).toHaveFocus();
    trigger.remove();
  });

  it('should open the settings modal when the store opens it', () => {
    render(<CourseOverlays />);

    act(() => {
      courseChrome.openSettings();
    });

    expect(screen.getByRole('dialog', { name: 'Settings' })).toBeInTheDocument();
    expect(screen.getByRole('switch', { name: 'Enable dark theme' })).toBeInTheDocument();
    expect(screen.getByText('When on, keyboard shortcuts are active.')).toBeInTheDocument();
    expect(screen.getByRole('switch', { name: 'Enable animations' })).toBeInTheDocument();
    expect(screen.getByText('When on, animations and transitions are applied.')).toBeInTheDocument();
  });
});
