import { useEffect } from 'react';

export interface UseCourseShortcutsOptions {
  currentLessonId: string;
  reachableLessonIds: string[];
  onNavigate: (lessonId: string) => void;
  /** Move focus into the interactive panel (Shift+2 or Alt+2). */
  onFocusInteractivePanel: () => void;
  /** Move focus into the instructions panel (Shift+1 or Alt+1). */
  onFocusInstructions: () => void;
  /** Open the lesson nav drawer (Alt+M). */
  onOpenDrawer: () => void;
  announce: (message: string) => void;
  enabled?: boolean;
}

export function useCourseShortcuts({
  currentLessonId,
  reachableLessonIds,
  onNavigate,
  onFocusInteractivePanel,
  onFocusInstructions,
  onOpenDrawer,
  announce,
  enabled = true,
}: UseCourseShortcutsOptions): void {
  useEffect(() => {
    if (!enabled) return;

    function step(delta: -1 | 1) {
      const index = reachableLessonIds.indexOf(currentLessonId);
      const target = index === -1 ? undefined : reachableLessonIds[index + delta];
      if (target) {
        onNavigate(target);
      } else {
        announce(delta === 1 ? 'no next lesson' : 'no previous lesson');
      }
    }

    function onKeyDown(event: KeyboardEvent) {
      if (
        (event.metaKey || event.ctrlKey) &&
        (event.key === 'ArrowLeft' || event.key === 'ArrowRight')
      ) {
        event.preventDefault();
        return;
      }

      if (event.altKey && !event.ctrlKey && !event.metaKey && !event.shiftKey) {
        if (event.code === 'KeyN') {
          event.preventDefault();
          step(1);
        } else if (event.code === 'KeyP') {
          event.preventDefault();
          step(-1);
        } else if (event.code === 'Digit1') {
          event.preventDefault();
          onFocusInstructions();
        } else if (event.code === 'Digit2') {
          event.preventDefault();
          onFocusInteractivePanel();
        } else if (event.code === 'KeyM') {
          event.preventDefault();
          onOpenDrawer();
        }
      } else if (event.shiftKey && !event.ctrlKey && !event.metaKey && !event.altKey) {
        if (event.code === 'KeyN') {
          event.preventDefault();
          step(1);
        } else if (event.code === 'KeyP') {
          event.preventDefault();
          step(-1);
        } else if (event.code === 'Digit1') {
          event.preventDefault();
          onFocusInstructions();
        } else if (event.code === 'Digit2') {
          event.preventDefault();
          onFocusInteractivePanel();
        }
      }
    }

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [
    enabled,
    currentLessonId,
    reachableLessonIds,
    onNavigate,
    onFocusInteractivePanel,
    onFocusInstructions,
    onOpenDrawer,
    announce,
  ]);
}
