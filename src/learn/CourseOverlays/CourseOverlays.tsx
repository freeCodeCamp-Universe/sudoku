import { useCurriculumTree } from '@/curriculum/useCurriculumTree';
import { NavDrawer } from '@/learn/NavDrawer/NavDrawer';
import { ShortcutsModal } from '@/learn/ShortcutsModal/ShortcutsModal';
import { useCourseChrome } from '@/learn/stores/courseChromeStore';

interface CourseOverlaysProps {
  currentLessonId?: string;
}

/**
 * The single island that hosts the global overlays, mounted once by
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
  const { drawerOpen, shortcutsOpen, closeDrawer, closeShortcuts, triggerElement } =
    useCourseChrome();

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
    </>
  );
}
