import type { Constraint } from '../types';
import { evenOdd } from './evenOdd';
import { uniqueness } from './uniqueness';

export const constraintRegistry: Record<string, Constraint> = {
  [evenOdd.id]: evenOdd,
  [uniqueness.id]: uniqueness,
};

export function resolveConstraints(ids: string[]): Constraint[] {
  return ids.map((id) => {
    const constraint = constraintRegistry[id];
    if (!constraint) {
      throw new Error(`Unknown constraint: ${id}`);
    }

    return constraint;
  });
}
