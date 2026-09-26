import type { ChecklistRequirement } from '@/curriculum/types';
import type { CellId, Solution, Values } from '@/engine/types';
import { boardReducer, createBoardState } from '@/board/boardReducer';

export interface CheckResult {
  passed: boolean;
}

export interface BoardLessonState extends ReturnType<typeof createBoardState> {
  selectedIds: Set<CellId>;
}

export type BoardLessonInput =
  | { type: 'board'; action: Parameters<typeof boardReducer>[1] }
  | { type: 'selection'; selectedIds: Set<CellId> };

/**
 * What an input means for the topmost unmet requirement: show that
 * requirement's hint, clear any hint on screen because the input met it, or
 * say nothing.
 */
export type InputReview = { kind: 'hint'; index: number } | { kind: 'clear' } | { kind: 'none' };

/**
 * The interface an interactive panel's engine must implement.
 *
 * `S` is the engine state type. The engine is purely functional — every method
 * is deterministic given the same inputs and produces no side effects.
 *
 * Engines remain pure so panels can grade a new state after each input.
 */
export interface LessonEngine<S, I = unknown> {
  /** Create the initial state from a lesson's seed data. */
  seed(lesson: { files: Record<string, string>; config: { checklist: ChecklistRequirement[] } }): S;

  /** Process one unit of user input and return the next state. */
  feed(state: S, input: I): S;

  /** Evaluate all checklist requirements against the current state. */
  checkRequirements(state: S, requirements: ChecklistRequirement[]): CheckResult[];

  /** Judge one input by the states before and after it. */
  reviewInput(previous: S, next: S, input: I, requirements: ChecklistRequirement[]): InputReview;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function sameSet<T>(left: Set<T>, right: Set<T>): boolean {
  return left.size === right.size && [...left].every((value) => right.has(value));
}

function requirementPasses(
  state: BoardLessonState,
  requirement: ChecklistRequirement,
  solution: Solution
): boolean {
  const { test } = requirement;

  if (Array.isArray(test.selected)) {
    const expected = test.selected.filter((id): id is string => typeof id === 'string');
    return (
      expected.length === test.selected.length && sameSet(state.selectedIds, new Set(expected))
    );
  }

  if (isRecord(test.values)) {
    return Object.entries(test.values).every(
      ([cellId, value]) => typeof value === 'number' && state.values.get(cellId) === value
    );
  }

  if (isRecord(test.candidates)) {
    return Object.entries(test.candidates).every(([cellId, value]) => {
      if (!Array.isArray(value) || !value.every((candidate) => typeof candidate === 'number')) {
        return false;
      }
      const actual = state.candidates.get(cellId) ?? [];
      return sameSet(new Set(actual), new Set(value));
    });
  }

  if (test.solved === true) {
    return (
      state.values.size === solution.size &&
      [...solution].every(([cellId, value]) => state.values.get(cellId) === value)
    );
  }

  return false;
}

/** Matching cells or candidates minus wrong ones, so an input's direction can be compared. */
function requirementScore(
  state: BoardLessonState,
  requirement: ChecklistRequirement,
  solution: Solution
): number {
  const { test } = requirement;
  const score = (actual: Iterable<unknown>, expected: Set<unknown>) =>
    [...actual].reduce<number>((total, item) => total + (expected.has(item) ? 1 : -1), 0);

  if (Array.isArray(test.selected)) {
    return score(state.selectedIds, new Set(test.selected));
  }

  if (isRecord(test.values)) {
    return Object.entries(test.values).reduce((total, [cellId, value]) => {
      const actual = state.values.get(cellId);
      return actual === undefined ? total : total + (actual === value ? 1 : -1);
    }, 0);
  }

  if (isRecord(test.candidates)) {
    return Object.entries(test.candidates).reduce(
      (total, [cellId, value]) =>
        total +
        score(state.candidates.get(cellId) ?? [], new Set(Array.isArray(value) ? value : [])),
      0
    );
  }

  if (test.solved === true) {
    return [...state.values].reduce((total, [cellId, value]) => {
      const expected = solution.get(cellId);
      return expected === undefined ? total : total + (expected === value ? 1 : -1);
    }, 0);
  }

  return 0;
}

/** A `selected` test grades selection input; every other test grades board input. */
function inputKindFor(requirement: ChecklistRequirement): BoardLessonInput['type'] {
  return Array.isArray(requirement.test.selected) ? 'selection' : 'board';
}

function reviewBoardInput(
  previous: BoardLessonState,
  next: BoardLessonState,
  input: BoardLessonInput,
  requirements: ChecklistRequirement[],
  solution: Solution
): InputReview {
  const unchanged =
    input.type === 'selection'
      ? sameSet(previous.selectedIds, next.selectedIds)
      : previous === next;
  if (unchanged) {
    return { kind: 'none' };
  }

  const firstUnmet = (state: BoardLessonState) =>
    requirements.findIndex((requirement) => !requirementPasses(state, requirement, solution));
  const target = firstUnmet(next);
  const previousTarget = firstUnmet(previous);

  if (target === -1 || (previousTarget !== -1 && target > previousTarget)) {
    return { kind: 'clear' };
  }

  const requirement = requirements[target];
  if (inputKindFor(requirement) !== input.type) {
    return { kind: 'none' };
  }

  const progressed =
    target === previousTarget &&
    requirementScore(next, requirement, solution) >
      requirementScore(previous, requirement, solution);
  return progressed ? { kind: 'none' } : { kind: 'hint', index: target };
}

export function createBoardLessonEngine(
  givens: Values,
  solution: Solution
): LessonEngine<BoardLessonState, BoardLessonInput> {
  return {
    seed() {
      return { ...createBoardState(givens), selectedIds: new Set() };
    },
    feed(state, input) {
      if (input.type === 'selection') {
        return { ...state, selectedIds: new Set(input.selectedIds) };
      }
      const next = boardReducer(state, input.action, givens);
      return next === state ? state : { ...next, selectedIds: state.selectedIds };
    },
    checkRequirements(state, requirements) {
      return requirements.map((requirement) => ({
        passed: requirementPasses(state, requirement, solution),
      }));
    },
    reviewInput(previous, next, input, requirements) {
      return reviewBoardInput(previous, next, input, requirements, solution);
    },
  };
}

/** A no-op engine that marks every requirement as passed immediately. */
export interface StubState {
  readonly _brand: 'stub';
}

export const stubEngine: LessonEngine<StubState> = {
  seed() {
    return { _brand: 'stub' };
  },
  feed(state) {
    return state;
  },
  checkRequirements(_, requirements) {
    return requirements.map(() => ({ passed: true }));
  },
  reviewInput() {
    return { kind: 'none' };
  },
};
