import type { Constraint } from '../types';
import { arrowSum } from './arrowSum';
import { cageSum } from './cageSum';
import { evenOdd } from './evenOdd';
import { skyscraperVisibility } from './skyscraperVisibility';
import { uniqueness } from './uniqueness';

export const constraintRegistry: Record<string, Constraint> = {
  [arrowSum.id]: arrowSum,
  [cageSum.id]: cageSum,
  [evenOdd.id]: evenOdd,
  [skyscraperVisibility.id]: skyscraperVisibility,
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
