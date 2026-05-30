import type { CellAnnotator } from '@/game/gameTypes';

export const annotatorRegistry: Record<string, CellAnnotator> = {};

export function resolveAnnotators(ids: string[] = []): CellAnnotator[] {
  return ids.map((id) => {
    const annotator = annotatorRegistry[id];

    if (!annotator) {
      throw new Error(`Unknown annotator: ${id}`);
    }

    return annotator;
  });
}
