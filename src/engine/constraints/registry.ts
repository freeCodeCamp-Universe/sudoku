import type { Constraint } from '../types';
import { arrowSum } from './arrowSum';
import { chain } from './chain';
import { cageSum } from './cageSum';
import { consecutive } from './consecutive';
import { evenOdd } from './evenOdd';
import { greaterThan } from './greaterThan';
import { sandwichSum } from './sandwichSum';
import { skyscraperVisibility } from './skyscraperVisibility';
import { uniqueness } from './uniqueness';

export const constraintRegistry: Record<string, Constraint> = {
  [arrowSum.id]: arrowSum,
  [chain.id]: chain,
  [cageSum.id]: cageSum,
  [consecutive.id]: consecutive,
  [evenOdd.id]: evenOdd,
  [greaterThan.id]: greaterThan,
  [sandwichSum.id]: sandwichSum,
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
