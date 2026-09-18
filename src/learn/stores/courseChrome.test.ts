import { afterEach, describe, expect, it } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { courseChrome, useCourseChrome } from '@/learn/stores/courseChromeStore';

afterEach(() => {
  courseChrome.reset();
});

describe('courseChrome', () => {
  it('should start with both overlays closed', () => {
    expect(courseChrome.getState()).toEqual({
      drawerOpen: false,
      shortcutsOpen: false,
      settingsOpen: false,
    });
  });

  it('should open and close the drawer and shortcuts independently', () => {
    courseChrome.openDrawer();
    expect(courseChrome.getState().drawerOpen).toBe(true);
    expect(courseChrome.getState().shortcutsOpen).toBe(false);

    courseChrome.openShortcuts();
    expect(courseChrome.getState().shortcutsOpen).toBe(true);

    courseChrome.closeDrawer();
    expect(courseChrome.getState().drawerOpen).toBe(false);
    expect(courseChrome.getState().shortcutsOpen).toBe(true);

    courseChrome.openSettings();
    expect(courseChrome.getState().settingsOpen).toBe(true);
    courseChrome.closeSettings();
    expect(courseChrome.getState().settingsOpen).toBe(false);
  });

  it('should notify a subscribing hook so islands re-render on a cross-island change', () => {
    const { result } = renderHook(() => useCourseChrome());
    expect(result.current.drawerOpen).toBe(false);

    act(() => {
      courseChrome.openDrawer();
    });
    expect(result.current.drawerOpen).toBe(true);

    act(() => {
      result.current.closeDrawer();
    });
    expect(result.current.drawerOpen).toBe(false);
  });
});
