import { describe, expect, it } from 'vitest';
import type { ChecklistRequirement } from '@/curriculum/types';
import type { Values } from '@/engine/types';
import { createBoardLessonEngine } from '@/curriculum/lessonEngine';

describe('createBoardLessonEngine', () => {
  it('should pass a solved requirement only when the board matches the solution', () => {
    const givens: Values = new Map([['r0c0', 1]]);
    const solution: Values = new Map([
      ['r0c0', 1],
      ['r0c1', 2],
    ]);
    const engine = createBoardLessonEngine(givens, solution);
    const lesson = {
      files: {},
      config: { checklist: [] as ChecklistRequirement[] },
    };
    const requirement: ChecklistRequirement = {
      label: 'Solve the board',
      test: { solved: true },
    };
    const initial = engine.seed(lesson);
    const wrong = engine.feed(initial, {
      type: 'board',
      action: { type: 'enterValue', cellId: 'r0c1', value: 3 },
    });

    expect(engine.checkRequirements(wrong, [requirement])).toEqual([{ passed: false }]);

    const solved = engine.feed(initial, {
      type: 'board',
      action: { type: 'enterValue', cellId: 'r0c1', value: 2 },
    });
    expect(engine.checkRequirements(solved, [requirement])).toEqual([{ passed: true }]);
  });
});
