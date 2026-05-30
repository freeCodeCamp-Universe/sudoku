import type { CellAnnotator } from '@/game/gameTypes';
import { argyleAnnotator } from './argyle';
import { asteriskAnnotator } from './asterisk';
import { evenCellAnnotator, oddCellAnnotator } from './evenOdd';
import { jigsawAnnotatorPlaceholder } from './jigsaw';
import { sudokuXAnnotator } from './sudoku-x';
import { windokuAnnotator } from './windoku';

export const annotatorRegistry: Record<string, CellAnnotator> = {
  [argyleAnnotator.id]: argyleAnnotator,
  [asteriskAnnotator.id]: asteriskAnnotator,
  [evenCellAnnotator.id]: evenCellAnnotator,
  [jigsawAnnotatorPlaceholder.id]: jigsawAnnotatorPlaceholder,
  [oddCellAnnotator.id]: oddCellAnnotator,
  [sudokuXAnnotator.id]: sudokuXAnnotator,
  [windokuAnnotator.id]: windokuAnnotator,
};

export function resolveAnnotators(ids: string[] = []): CellAnnotator[] {
  return ids.map((id) => {
    const annotator = annotatorRegistry[id];

    if (!annotator) {
      throw new Error(`Unknown annotator: ${id}`);
    }

    return annotator;
  });
}
