import { describe, expect, it } from 'vitest';

import { curriculum } from '@/curriculum/ordering';
import { getLessonReachability, orderedLessonIds } from '@/curriculum/lessonOrder';

describe('ordering', () => {
  it('should give every module a title and at least one lesson', () => {
    for (const module of curriculum) {
      expect(module.title.length).toBeGreaterThan(0);
      expect(module.lessons.length).toBeGreaterThan(0);
    }
  });

  it('should not repeat a lesson id across the course', () => {
    expect(new Set(orderedLessonIds).size).toBe(orderedLessonIds.length);
  });
});

describe('getLessonReachability', () => {
  it('should treat every lesson as reachable with the first as the frontier on a first visit', () => {
    const reachability = getLessonReachability([]);

    expect(reachability.completedLessonIds).toEqual([]);
    expect(reachability.frontierLessonId).toBe(orderedLessonIds[0]);
    expect(reachability.reachableLessonIds).toEqual(orderedLessonIds);
  });

  it('should normalize completion into course order rather than the order given', () => {
    const reversed = [...orderedLessonIds].reverse();
    const reachability = getLessonReachability(reversed);

    expect(reachability.completedLessonIds).toEqual(orderedLessonIds);
  });

  it('should leave the frontier on an earlier lesson skipped over', () => {
    const reachability = getLessonReachability([orderedLessonIds[orderedLessonIds.length - 1]]);

    expect(reachability.frontierLessonId).toBe(orderedLessonIds[0]);
    expect(reachability.reachableLessonIds).toEqual(orderedLessonIds);
  });

  it('should have no frontier once every lesson is complete', () => {
    const reachability = getLessonReachability(orderedLessonIds);

    expect(reachability.completedLessonIds).toEqual(orderedLessonIds);
    expect(reachability.frontierLessonId).toBeUndefined();
    expect(reachability.reachableLessonIds).toEqual(orderedLessonIds);
  });
});
