import type { CellAnnotator } from '@/game/gameTypes';
import { arrowBulbAnnotator, arrowPathAnnotator } from './arrow';
import { argyleAnnotator } from './argyle';
import { asteriskAnnotator } from './asterisk';
import { cageSumAnnotator } from './cage';
import { evenCellAnnotator, oddCellAnnotator } from './evenOdd';
import { jigsawAnnotatorPlaceholder } from './jigsaw';
import { skyscraperClueAnnotator } from './skyscraper';
import { sudokuXAnnotator } from './sudoku-x';
import { windokuAnnotator } from './windoku';

export const annotatorRegistry: Record<string, CellAnnotator> = {
  [arrowBulbAnnotator.id]: arrowBulbAnnotator,
  [arrowPathAnnotator.id]: arrowPathAnnotator,
  [argyleAnnotator.id]: argyleAnnotator,
  [asteriskAnnotator.id]: asteriskAnnotator,
  [cageSumAnnotator.id]: cageSumAnnotator,
  [evenCellAnnotator.id]: evenCellAnnotator,
  [jigsawAnnotatorPlaceholder.id]: jigsawAnnotatorPlaceholder,
  [oddCellAnnotator.id]: oddCellAnnotator,
  [skyscraperClueAnnotator.id]: skyscraperClueAnnotator,
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
