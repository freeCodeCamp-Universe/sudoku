import { buildModel } from '@/engine/buildModel';
import { generate } from '@/engine/generate';
import type { Cell, CellId, SymbolValue, Values, Variant, VariantModel } from '@/engine/types';
import type { GutterSlots, Rect, Size } from '@/game/gameTypes';
import { resolveLayout } from '@/game/layouts/registry';
import { isJigsawStructure, makeJigsawVariant } from '@/variants/jigsaw';
import { variantRegistry } from '@/variants/registry';

export interface PreviewData {
  variant: Variant;
  cells: Cell[];
  givens: Values;
  rects: Map<CellId, Rect>;
  size: Size;
  gutters?: GutterSlots;
  structure?: unknown;
  renderSymbol: (value: SymbolValue) => string;
}

function seeded(seed: number): () => number {
  let state = seed;

  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 0x100000000;
  };
}

function hashVariantId(variantId: string): number {
  let hash = 0;

  for (const character of variantId) {
    hash = (hash * 31 + character.charCodeAt(0)) >>> 0;
  }

  return hash || 1;
}

function resolvePreviewVariant(
  variant: Variant,
  model: VariantModel,
  solution: Values
): { liveVariant: Variant; structure?: unknown } {
  const structure = variant.deriveStructure?.(solution, model);

  if (variant.id === 'jigsaw' && isJigsawStructure(structure)) {
    return {
      liveVariant: makeJigsawVariant(structure.regions),
      structure,
    };
  }

  return {
    liveVariant: variant,
    structure,
  };
}

const cache = new Map<string, PreviewData>();

export function getPreview(variantId: string): PreviewData {
  const existing = cache.get(variantId);

  if (existing) {
    return existing;
  }

  const variant = variantRegistry[variantId];

  if (!variant) {
    throw new Error(`Unknown variant: ${variantId}`);
  }

  const model = buildModel(variant);
  const { solution, givens } = generate(model, 'beginner', seeded(hashVariantId(variant.id)));
  const { liveVariant, structure } = resolvePreviewVariant(variant, model, solution);
  const liveModel = liveVariant === variant ? model : buildModel(liveVariant);
  const layoutStrategy = resolveLayout(liveVariant.layout.kind);
  const renderSymbol = liveVariant.renderSymbol
    ? (value: SymbolValue) => liveVariant.renderSymbol!(value, structure)
    : (value: SymbolValue) => String(value);
  const data: PreviewData = {
    variant: liveVariant,
    cells: liveModel.cells,
    givens,
    rects: layoutStrategy.cellRects(liveVariant),
    size: layoutStrategy.canvasSize(liveVariant),
    gutters: liveVariant.deriveGutters?.(structure) ?? layoutStrategy.gutters?.(liveVariant),
    structure,
    renderSymbol,
  };

  cache.set(variantId, data);

  return data;
}
