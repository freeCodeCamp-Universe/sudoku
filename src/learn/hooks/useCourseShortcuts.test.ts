import { describe, expect, it, vi } from 'vitest';
import { fireEvent } from '@testing-library/react';
import { renderHook } from '@testing-library/react';
import { useCourseShortcuts, type UseCourseShortcutsOptions } from '@/learn/hooks/useCourseShortcuts';

const reachable = ['a', 'b', 'c'];

function setup(overrides: Partial<UseCourseShortcutsOptions> = {}) {
  const onNavigate = vi.fn();
  const onFocusInteractivePanel = vi.fn();
  const onFocusInstructions = vi.fn();
  const onOpenDrawer = vi.fn();
  const onOpenShortcuts = vi.fn();
  const announce = vi.fn();

  const options: UseCourseShortcutsOptions = {
    currentLessonId: 'b',
    reachableLessonIds: reachable,
    onNavigate,
    onFocusInteractivePanel,
    onFocusInstructions,
    onOpenDrawer,
    onOpenShortcuts,
    announce,
    ...overrides,
  };

  const { rerender, unmount } = renderHook((props: UseCourseShortcutsOptions) => useCourseShortcuts(props), {
    initialProps: options,
  });

  return {
    onNavigate,
    onFocusInteractivePanel,
    onFocusInstructions,
    onOpenDrawer,
    onOpenShortcuts,
    announce,
    rerender,
    unmount,
  };
}

function press(code: string, modifiers: Partial<KeyboardEventInit> = {}) {
  fireEvent.keyDown(window, { code, ...modifiers });
}

function pressKey(key: string, modifiers: Partial<KeyboardEventInit> = {}) {
  const event = new KeyboardEvent('keydown', {
    key,
    bubbles: true,
    cancelable: true,
    ...modifiers,
  });
  window.dispatchEvent(event);
  return event;
}

describe('useCourseShortcuts', () => {
  it('should move to the next reachable lesson on Alt+N', () => {
    const { onNavigate } = setup();

    press('KeyN', { altKey: true });

    expect(onNavigate).toHaveBeenCalledWith('c');
  });

  it('should move to the previous reachable lesson on Alt+P', () => {
    const { onNavigate } = setup();

    press('KeyP', { altKey: true });

    expect(onNavigate).toHaveBeenCalledWith('a');
  });

  it('should not skip past the frontier and should note the boundary on Alt+N at the end', () => {
    const { onNavigate, announce } = setup({ currentLessonId: 'c' });

    press('KeyN', { altKey: true });

    expect(onNavigate).not.toHaveBeenCalled();
    expect(announce).toHaveBeenCalledWith('no next lesson');
  });

  it('should note the boundary on Alt+P at the first lesson', () => {
    const { onNavigate, announce } = setup({ currentLessonId: 'a' });

    press('KeyP', { altKey: true });

    expect(onNavigate).not.toHaveBeenCalled();
    expect(announce).toHaveBeenCalledWith('no previous lesson');
  });

  it('should focus the instructions panel on Alt+1', () => {
    const { onFocusInstructions } = setup();

    press('Digit1', { altKey: true });

    expect(onFocusInstructions).toHaveBeenCalledTimes(1);
  });

  it('should focus the terminal on Alt+2', () => {
    const { onFocusInteractivePanel } = setup();

    press('Digit2', { altKey: true });

    expect(onFocusInteractivePanel).toHaveBeenCalledTimes(1);
  });

  it('should open the drawer on Alt+M', () => {
    const { onOpenDrawer } = setup();

    press('KeyM', { altKey: true });

    expect(onOpenDrawer).toHaveBeenCalledTimes(1);
  });

  it('should not open the drawer on Alt+K', () => {
    const { onOpenDrawer } = setup();

    press('KeyK', { altKey: true });

    expect(onOpenDrawer).not.toHaveBeenCalled();
  });

  it('should open the shortcuts modal on Alt+/', () => {
    const { onOpenShortcuts } = setup();

    press('Slash', { altKey: true });

    expect(onOpenShortcuts).toHaveBeenCalledTimes(1);
  });

  it('should leave Cmd/Ctrl+M available to the browser or operating system', () => {
    const { onOpenDrawer } = setup();

    press('KeyM', { metaKey: true });
    press('KeyM', { ctrlKey: true });

    expect(onOpenDrawer).not.toHaveBeenCalled();
  });

  it('should prevent Cmd+ArrowLeft and Cmd+ArrowRight from navigating lesson history', () => {
    const { onNavigate } = setup();

    const left = pressKey('ArrowLeft', { metaKey: true });
    const right = pressKey('ArrowRight', { metaKey: true });

    expect(left.defaultPrevented).toBe(true);
    expect(right.defaultPrevented).toBe(true);
    expect(onNavigate).not.toHaveBeenCalled();
  });

  it('should ignore bare keys so typed Vim commands are untouched', () => {
    const { onNavigate, onFocusInteractivePanel, onFocusInstructions, onOpenDrawer, onOpenShortcuts } = setup();

    press('KeyN');
    press('KeyP');
    press('Digit1');
    press('Digit2');
    press('KeyM');
    press('Slash');

    expect(onNavigate).not.toHaveBeenCalled();
    expect(onFocusInteractivePanel).not.toHaveBeenCalled();
    expect(onFocusInstructions).not.toHaveBeenCalled();
    expect(onOpenDrawer).not.toHaveBeenCalled();
    expect(onOpenShortcuts).not.toHaveBeenCalled();
  });

  it('should not act while disabled', () => {
    const { onNavigate, onOpenDrawer, onOpenShortcuts } = setup({ enabled: false });

    press('KeyN', { altKey: true });
    press('KeyM', { altKey: true });
    press('Slash', { shiftKey: true });

    expect(onNavigate).not.toHaveBeenCalled();
    expect(onOpenDrawer).not.toHaveBeenCalled();
    expect(onOpenShortcuts).not.toHaveBeenCalled();
  });

  it('should stop firing after unmount', () => {
    const { onNavigate, unmount } = setup();

    unmount();
    press('KeyN', { altKey: true });

    expect(onNavigate).not.toHaveBeenCalled();
  });
});
