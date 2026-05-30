import { cellId, range } from '@/engine/grid';
import type { BoardLayout, House, TriangularLayout, Variant } from '@/engine/types';

const layout: TriangularLayout = { kind: 'triangular', size: 9 };

function buildDiagonalExtra(boardLayout: BoardLayout): House[] {
  if (boardLayout.kind !== 'triangular') {
    throw new Error(`Unsupported layout kind: ${boardLayout.kind}`);
  }

  return [
    {
      id: 'tri-diagonal',
      cells: range(boardLayout.size).map((index) => cellId(index, index)),
    },
  ];
}

export const sujiken: Variant = {
  id: 'sujiken',
  name: 'Sujiken',
  difficulty: 'intermediate',
  layout,
  symbols: [1, 2, 3, 4, 5, 6, 7, 8, 9],
  symbolKind: 'digit',
  constraintIds: ['uniqueness'],
  overlayIds: [],
  annotatorIds: [],
  extraHouses: buildDiagonalExtra,
};
