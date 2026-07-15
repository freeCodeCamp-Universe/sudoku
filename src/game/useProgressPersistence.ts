import type { CellId, SymbolValue } from '@/engine/types';

export interface SavedProgress {
  seedBase: number;
  jigsawLayoutStart: number;
  genKey: number;
  values: [CellId, SymbolValue][];
  candidates: [CellId, SymbolValue[]][];
  revealed: CellId[];
  elapsedSeconds: number;
}

function storageKey(variantId: string): string {
  return `sudoku-progress-${variantId}`;
}

export function loadProgress(variantId: string): SavedProgress | null {
  try {
    const raw = localStorage.getItem(storageKey(variantId));
    return raw ? (JSON.parse(raw) as SavedProgress) : null;
  } catch {
    return null;
  }
}

export function saveProgress(variantId: string, data: SavedProgress): void {
  try {
    localStorage.setItem(storageKey(variantId), JSON.stringify(data));
  } catch {
    // storage quota exceeded — skip silently
  }
}

export function clearProgress(variantId: string): void {
  localStorage.removeItem(storageKey(variantId));
}
