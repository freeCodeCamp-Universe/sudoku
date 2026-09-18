import { useCurriculumTree } from '@/learn/curriculum/useCurriculumTree';
import { NavDrawer } from '@/learn/features/NavDrawer/NavDrawer';
import { SettingsModal } from '@/learn/base/SettingsModal/SettingsModal';
import { ShortcutsModal } from '@/learn/base/ShortcutsModal/ShortcutsModal';
import { useCourseChrome } from '@/learn/stores/courseChromeStore';

interface CourseOverlaysProps {
  currentLessonId?: string;
}

/**
 * The single island that hosts both global overlays, mounted once by
 * {@link CourseLayout}. It connects the two controlled dialogs to the shared
 * {@link courseChrome} store so the header buttons and a lesson's `Alt+K`
 * — which live in other islands — can open them across the island boundary.
 *
 * The curriculum tree for the nav drawer is loaded from a static JSON endpoint
 * rather than inlined in every page's HTML. The drawer starts closed, so the
 * async fetch is invisible to the user.
 */
export function CourseOverlays({ currentLessonId }: CourseOverlaysProps) {
  const tree = useCurriculumTree();
  const {
    drawerOpen,
    shortcutsOpen,
    settingsOpen,
    closeDrawer,
    closeShortcuts,
    closeSettings,
    triggerElement,
  } = useCourseChrome();

  return (
    <>
      <NavDrawer
        open={drawerOpen}
        onClose={closeDrawer}
        modules={tree?.modules ?? []}
        currentLessonId={currentLessonId}
        triggerElement={triggerElement}
      />
      <ShortcutsModal
        open={shortcutsOpen}
        onClose={closeShortcuts}
        triggerElement={triggerElement}
      />
      <SettingsModal open={settingsOpen} onClose={closeSettings} triggerElement={triggerElement} />
    </>
  );
}
