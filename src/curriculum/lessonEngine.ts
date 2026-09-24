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

  /** Return a human-readable explanation of why a requirement is not yet met. */
  explainIncomplete(state: S, requirement: ChecklistRequirement): string;
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
    explainIncomplete(state, requirement) {
      return requirementPasses(state, requirement, solution)
        ? ''
        : `Complete "${requirement.label}" on the board.`;
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
  explainIncomplete() {
    return '';
  },
};
