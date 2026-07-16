import type { CellId, SymbolValue } from '@/engine/types';

// Bumped when the mapping from the saved seeds to a generated board changes
// (schema 2: jigsaw regions generated from the seed instead of preset
// layouts). A save written under an older schema would restore its values
// onto a different board, so it is discarded instead.
const JIGSAW_LAYOUT_SCHEMA = 2;

export interface SavedProgress {
  seedBase: number;
  jigsawLayoutStart: number;
  genKey: number;
  values: [CellId, SymbolValue][];
  candidates: [CellId, SymbolValue[]][];
  revealed: CellId[];
  elapsedSeconds: number;
  layoutSchema?: number;
}

function storageKey(variantId: string): string {
  return `sudoku-progress-${variantId}`;
}

export function loadProgress(variantId: string): SavedProgress | null {
  try {
    const raw = localStorage.getItem(storageKey(variantId));
    const data = raw ? (JSON.parse(raw) as SavedProgress) : null;

    if (data && variantId === 'jigsaw' && data.layoutSchema !== JIGSAW_LAYOUT_SCHEMA) {
      return null;
    }

    return data;
  } catch {
    return null;
  }
}

export function saveProgress(variantId: string, data: SavedProgress): void {
  try {
    localStorage.setItem(
      storageKey(variantId),
      JSON.stringify({ ...data, layoutSchema: JIGSAW_LAYOUT_SCHEMA })
    );
  } catch {
    // storage quota exceeded — skip silently
  }
}

export function clearProgress(variantId: string): void {
  localStorage.removeItem(storageKey(variantId));
}
