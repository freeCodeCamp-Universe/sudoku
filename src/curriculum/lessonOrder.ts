import { loadCurriculum } from '@/curriculum/loader';

export interface LessonReachability {
  completedLessonIds: string[];
  /** Every lesson id, in course order: lessons are never locked. */
  reachableLessonIds: string[];
  /** The first not-yet-completed lesson, used for the "current" marker. */
  frontierLessonId?: string;
}

const { modules } = loadCurriculum();

export const moduleSlugs = modules.map((module) => module.slug);

export const orderedLessonIds = modules.flatMap((module) => module.lessonIds);

/**
 * Every lesson is reachable: learners pick freely from the overview or the nav
 * drawer, and `Shift+N`/`Shift+P` step across the whole course. Completion is still
 * tracked (for checkmarks) and the first incomplete lesson is surfaced as the
 * frontier so the overview can highlight where the learner left off.
 */
export function getLessonReachability(completedLessonIds: Iterable<string>): LessonReachability {
  const completed = new Set(completedLessonIds);
  const completedInOrder = orderedLessonIds.filter((lessonId) => completed.has(lessonId));

  return {
    completedLessonIds: completedInOrder,
    reachableLessonIds: orderedLessonIds,
    frontierLessonId: orderedLessonIds.find((lessonId) => !completed.has(lessonId)),
  };
}
