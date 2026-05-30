import type { CellAnnotator } from '@/game/gameTypes';
import { argyleAnnotator } from './argyle';
import { asteriskAnnotator } from './asterisk';
import { jigsawAnnotatorPlaceholder } from './jigsaw';
import { sudokuXAnnotator } from './sudoku-x';
import { windokuAnnotator } from './windoku';

export const annotatorRegistry: Record<string, CellAnnotator> = {
  [argyleAnnotator.id]: argyleAnnotator,
  [asteriskAnnotator.id]: asteriskAnnotator,
  [jigsawAnnotatorPlaceholder.id]: jigsawAnnotatorPlaceholder,
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
