import { describe, expect, it } from 'vitest';
import type { ChecklistRequirement } from '@/curriculum/types';
import type { Values } from '@/engine/types';
import { createBoardLessonEngine } from '@/curriculum/lessonEngine';
import type { BoardLessonInput, BoardLessonState } from '@/curriculum/lessonEngine';

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

describe('createBoardLessonEngine reviewInput', () => {
  const givens: Values = new Map([['r0c0', 1]]);
  const solution: Values = new Map([
    ['r0c0', 1],
    ['r0c1', 2],
    ['r0c2', 3],
  ]);
  const engine = createBoardLessonEngine(givens, solution);
  const initial = engine.seed({ files: {}, config: { checklist: [] } });
  const selectRequirement: ChecklistRequirement = {
    label: 'Select two cells',
    hint: 'You can select r1c2 and r1c3.',
    test: { selected: ['r0c1', 'r0c2'] },
  };
  const valuesRequirement: ChecklistRequirement = {
    label: 'Fill two cells',
    hint: 'You can enter 2 and 3.',
    test: { values: { r0c1: 2, r0c2: 3 } },
  };

  function select(state: BoardLessonState, ids: string[]) {
    const input: BoardLessonInput = { type: 'selection', selectedIds: new Set(ids) };
    return { input, next: engine.feed(state, input) };
  }

  function enter(state: BoardLessonState, cellId: string, value: number) {
    const input: BoardLessonInput = {
      type: 'board',
      action: { type: 'enterValue', cellId, value },
    };
    return { input, next: engine.feed(state, input) };
  }

  it('should say nothing while a selection moves toward the target', () => {
    const { input, next } = select(initial, ['r0c1']);

    expect(engine.reviewInput(initial, next, input, [selectRequirement])).toEqual({
      kind: 'none',
    });
  });

  it('should hint when a selection moves away from the target', () => {
    const { input, next } = select(initial, ['r0c0']);

    expect(engine.reviewInput(initial, next, input, [selectRequirement])).toEqual({
      kind: 'hint',
      index: 0,
    });
  });

  it('should clear the hint when the input meets the target requirement', () => {
    const partial = select(initial, ['r0c1']).next;
    const { input, next } = select(partial, ['r0c1', 'r0c2']);

    expect(engine.reviewInput(partial, next, input, [selectRequirement])).toEqual({
      kind: 'clear',
    });
  });

  it('should hint only the topmost unmet requirement', () => {
    const { input, next } = enter(initial, 'r0c1', 5);

    expect(
      engine.reviewInput(initial, next, input, [valuesRequirement, valuesRequirement])
    ).toEqual({ kind: 'hint', index: 0 });
  });

  it('should target the next requirement once the one above it is met', () => {
    const met = select(initial, ['r0c1', 'r0c2']).next;
    const { input, next } = enter(met, 'r0c1', 5);

    expect(engine.reviewInput(met, next, input, [selectRequirement, valuesRequirement])).toEqual({
      kind: 'hint',
      index: 1,
    });
  });

  it('should hint when a board input leaves a values requirement where it was', () => {
    const { input, next } = enter(initial, 'r0c1', 2);
    const unrelated: ChecklistRequirement = { label: 'Fill r1c3', test: { values: { r0c2: 3 } } };

    expect(engine.reviewInput(initial, next, input, [unrelated])).toEqual({
      kind: 'hint',
      index: 0,
    });
  });

  it('should ignore selection input while a values requirement is the target', () => {
    const { input, next } = select(initial, ['r0c0']);

    expect(engine.reviewInput(initial, next, input, [valuesRequirement])).toEqual({
      kind: 'none',
    });
  });

  it('should say nothing when an input changes nothing', () => {
    const { input, next } = enter(initial, 'r0c0', 5);

    expect(next).toBe(initial);
    expect(engine.reviewInput(initial, next, input, [valuesRequirement])).toEqual({
      kind: 'none',
    });
  });
});
