import { useEffect, useMemo, useRef, useState } from 'react';
import { useProgress } from '@/learn/hooks/useProgress';
import { type CurriculumTreeLessonState, type CurriculumTreeModule } from '@/learn/features/CurriculumTree/CurriculumTree';
import { Progress } from '@/learn/features/Progress/Progress';
import { CurriculumNavigator } from '@/learn/features/CurriculumNavigator/CurriculumNavigator';
import { CurriculumSearch } from '@/learn/features/CurriculumSearch/CurriculumSearch';
import { Drawer } from '@/learn/base/Drawer/Drawer';

export interface NavDrawerProps {
  /** Whether the drawer is shown. Owned by the parent (header button / `Alt+K`). */
  open: boolean;
  /** Close the drawer; the parent flips `open` to false. */
  onClose: () => void;
  /** Module/lesson view-model from the curriculum tree. */
  modules: CurriculumTreeModule[];
  /** Lesson currently open, used for the drawer's current indicator. */
  currentLessonId?: string;
  /** Element to restore focus to on close. Forwarded to Drawer/Modal. */
  triggerElement?: HTMLElement | null;
}

export function NavDrawer({ open, onClose, modules, currentLessonId, triggerElement }: NavDrawerProps) {
  const currentLessonRef = useRef<HTMLAnchorElement | null>(null);
  const [query, setQuery] = useState('');
  const { completed } = useProgress();

  useEffect(() => {
    if (!open) {
      setQuery('');
    }
  }, [open]);

  const completedSet = useMemo(() => {
    const ids = modules.flatMap((module) => module.lessons.map((lesson) => lesson.id));
    return new Set(ids.filter((id) => completed.includes(id)));
  }, [modules, completed]);
  const totalLessons = modules.reduce((total, module) => total + module.lessons.length, 0);

  function lessonState(id: string): CurriculumTreeLessonState {
    if (id === currentLessonId) {
      return completedSet.has(id) ? 'completed-current' : 'current';
    }
    if (completedSet.has(id)) {
      return 'completed';
    }
    return 'available';
  }

  return (
    <Drawer
      open={open}
      onClose={onClose}
      slideFrom="end"
      title="Lessons"
      subtitle={<Progress completed={completedSet.size} total={totalLessons} />}
      headerContent={<CurriculumSearch query={query} onQueryChange={setQuery} />}
      triggerElement={triggerElement}
      initialFocus={currentLessonId ? currentLessonRef : undefined}
    >
      <Drawer.Body>
        <CurriculumNavigator modules={modules} variant="drawer" query={query} onQueryChange={setQuery} showSearch={false} lessonState={lessonState} onLessonClick={onClose} currentLessonRef={currentLessonRef} />
      </Drawer.Body>
    </Drawer>
  );
}
