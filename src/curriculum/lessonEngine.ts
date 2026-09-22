import type { ChecklistRequirement } from '@/curriculum/types';

export interface CheckResult {
  passed: boolean;
}

/**
 * The interface an interactive panel's engine must implement.
 *
 * `S` is the engine state type. The engine is purely functional — every method
 * is deterministic given the same inputs and produces no side effects.
 *
 * Replace the `StubEngine` with a real implementation when building your
 * interactive panel. See architecture.md for guidance.
 */
export interface LessonEngine<S> {
  /** Create the initial state from a lesson's seed data. */
  seed(lesson: { files: Record<string, string>; config: { checklist: ChecklistRequirement[] } }): S;

  /** Process one unit of user input and return the next state. */
  feed(state: S, input: unknown): S;

  /** Evaluate all checklist requirements against the current state. */
  checkRequirements(state: S, requirements: ChecklistRequirement[]): CheckResult[];

  /** Return a human-readable explanation of why a requirement is not yet met. */
  explainIncomplete(state: S, requirement: ChecklistRequirement): string;
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
