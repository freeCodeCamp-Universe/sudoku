import { cellId, range } from '@/engine/grid';
import type { Solution, Variant, VariantModel } from '@/engine/types';
import type { Relation } from '@/engine/constraints/greaterThan';

function deriveStructure(solution: Solution, _model: VariantModel): { relations: Relation[] } {
  const relations: Relation[] = [];

  for (const row of range(9)) {
    for (const col of range(8)) {
      const left = cellId(row, col);
      const right = cellId(row, col + 1);
      const leftValue = solution.get(left);
      const rightValue = solution.get(right);

      if (leftValue === undefined || rightValue === undefined) {
        continue;
      }

      relations.push(
        leftValue > rightValue
          ? { greater: left, lesser: right }
          : { greater: right, lesser: left }
      );
    }
  }

  for (const row of range(8)) {
    for (const col of range(9)) {
      const top = cellId(row, col);
      const bottom = cellId(row + 1, col);
      const topValue = solution.get(top);
      const bottomValue = solution.get(bottom);

      if (topValue === undefined || bottomValue === undefined) {
        continue;
      }

      relations.push(
        topValue > bottomValue
          ? { greater: top, lesser: bottom }
          : { greater: bottom, lesser: top }
      );
    }
  }

  return { relations };
}

export const greaterThanVariant: Variant = {
  id: 'greater-than',
  name: 'Greater-Than Sudoku',
  difficulty: 'intermediate',
  layout: { kind: 'grid', size: 9, box: { rows: 3, cols: 3 } },
  symbols: [1, 2, 3, 4, 5, 6, 7, 8, 9],
  symbolKind: 'digit',
  constraintIds: ['uniqueness', 'greaterThan'],
  overlayIds: ['inequality'],
  annotatorIds: ['greater-than-cell'],
  deriveStructure,
};
