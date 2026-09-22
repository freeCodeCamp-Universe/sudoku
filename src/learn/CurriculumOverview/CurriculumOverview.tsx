import { useEffect, useMemo } from 'react';
import { useCurriculumTree } from '@/learn/curriculum/useCurriculumTree';
import { Button } from '@/components/Button';
import { LoadingState } from '@/learn/LoadingState/LoadingState';
import { CurriculumNavigator } from '@/learn/CurriculumNavigator/CurriculumNavigator';
import { Progress } from '@/learn/Progress/Progress';
import { prefetchLesson } from '@/learn/hooks/useLessonData';
import { useProgress } from '@/learn/hooks/useProgress';
import styles from '@/learn/CurriculumOverview/CurriculumOverview.module.css';

// Stable empty arrays so the ?? fallback doesn't create a new reference each render,
// which would invalidate downstream useMemo deps.
const EMPTY_IDS: string[] = [];
const EMPTY_MODULES: never[] = [];

export function CurriculumOverview() {
  const tree = useCurriculumTree();
  const { completed, lastCompletedId } = useProgress();

  const orderedLessonIds = tree?.orderedLessonIds ?? EMPTY_IDS;
  const modules = tree?.modules ?? EMPTY_MODULES;

  const completedSet = useMemo(() => {
    const lessonIds = new Set(orderedLessonIds);
    return new Set(completed.filter((id) => lessonIds.has(id)));
  }, [completed, orderedLessonIds]);

  // The lesson to resume from:
  //   - Not started: first lesson in course order.
  //   - In progress: lesson after the most recently completed one, falling back to
  //     the frontier when the next sequential lesson doesn't exist (e.g. the user
  //     completed the last lesson but has gaps earlier in the course).
  //   - Last completed lesson no longer in curriculum: fall back to first uncompleted.
  //   - All available lessons done: undefined — button is hidden.
  const continueId = useMemo(() => {
    if (orderedLessonIds.length === 0) {
      return undefined;
    }

    const completedIds = new Set(completed);
    const frontier = orderedLessonIds.find((id) => !completedIds.has(id));

    if (lastCompletedId === undefined) {
      return frontier ?? orderedLessonIds[0];
    }

    const idx = orderedLessonIds.indexOf(lastCompletedId);
    if (idx === -1) {
      return frontier;
    }

    return orderedLessonIds[idx + 1] ?? frontier;
  }, [lastCompletedId, completed, orderedLessonIds]);

  useEffect(() => {
    if (continueId && tree) {
      prefetchLesson(continueId, tree);
    }
  }, [continueId, tree]);

  if (!tree) {
    return <LoadingState label="Loading course" className={styles.loading} />;
  }

  const hasStarted = lastCompletedId !== undefined;

  return (
    <div>
      {tree && <Progress completed={completedSet.size} total={orderedLessonIds.length} />}
      {continueId !== undefined && (
        <div className={styles['cta-row']}>
          <Button variant="cta" href={`/learn/${continueId}`} className={styles['cta-button']}>
            {hasStarted ? 'Continue' : 'Start learning'}
          </Button>
        </div>
      )}
      {modules.length > 0 && (
        <CurriculumNavigator
          modules={modules}
          variant="home"
          lessonState={(id) => (completedSet.has(id) ? 'completed' : 'available')}
        />
      )}
    </div>
  );
}
