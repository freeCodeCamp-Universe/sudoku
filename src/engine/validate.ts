import type { Conflict, Values, VariantModel } from './types';

export function validate(values: Values, model: VariantModel): Conflict[] {
  return model.constraints.flatMap((constraint) => constraint.conflicts(values, model));
}
