import { useEffect, useState } from 'react';
import { useCurriculumTree, type CurriculumTree } from '@/learn/curriculum/useCurriculumTree';
import type { LessonPageProps } from '@/learn/LessonPage/LessonPage';

export type LessonData = LessonPageProps;

const cache = new Map<string, LessonData>();
const pending = new Map<string, Promise<LessonData>>();

function fetchLesson(lessonId: string, dataFile: string): Promise<LessonData> {
  if (pending.has(lessonId)) {
    return pending.get(lessonId)!;
  }
  const promise = fetch(`/data/lessons/${dataFile}`)
    .then((r) => r.json() as Promise<LessonData>)
    .then((data) => {
      cache.set(lessonId, data);
      pending.delete(lessonId);
      return data;
    });
  pending.set(lessonId, promise);
  return promise;
}

export interface UseLessonDataResult {
  data: LessonData | null;
  loading: boolean;
  error: boolean;
}

/**
 * Eagerly fetch a lesson into the cache so it's ready when the user navigates.
 * No-ops when tree isn't loaded yet or the lesson is already cached/in-flight.
 */
export function prefetchLesson(lessonId: string, tree: CurriculumTree): void {
  if (cache.has(lessonId) || pending.has(lessonId)) {
    return;
  }
  const lesson = tree.modules.flatMap((m) => m.lessons).find((l) => l.id === lessonId);
  if (lesson?.dataFile) {
    fetchLesson(lessonId, lesson.dataFile).catch(() => {});
  }
}

export function useLessonData(lessonId: string): UseLessonDataResult {
  const tree = useCurriculumTree();
  const [data, setData] = useState<LessonData | null>(cache.get(lessonId) ?? null);
  const [loading, setLoading] = useState(!cache.has(lessonId));
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!tree) {
      return;
    }

    if (cache.has(lessonId)) {
      setData(cache.get(lessonId)!);
      setLoading(false);
      setError(false);
    } else {
      const lesson = tree.modules.flatMap((m) => m.lessons).find((l) => l.id === lessonId);
      if (!lesson || !lesson.dataFile) {
        setLoading(false);
        setError(true);
        return;
      }

      setLoading(true);
      setError(false);

      fetchLesson(lessonId, lesson.dataFile)
        .then((d) => {
          setData(d);
          setLoading(false);
        })
        .catch(() => {
          setLoading(false);
          setError(true);
        });
    }

    // Prefetch the next lesson regardless of whether the current one
    // was served from cache or fetched fresh.
    const ordered = tree.orderedLessonIds;
    const idx = ordered.indexOf(lessonId);
    const nextId = ordered[idx + 1];
    if (nextId) {
      prefetchLesson(nextId, tree);
    }
  }, [lessonId, tree]);

  return { data, loading, error };
}
