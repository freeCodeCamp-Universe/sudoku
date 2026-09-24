import { createElement, useMemo } from 'react';
import { createSeededRng, hashSeed } from '@/engine/rng';
import type { CellId, Solution, SymbolValue, Variant, VariantModel } from '@/engine/types';
import { assemblePuzzle } from '@/board/assemblePuzzle';
import { resolveAnnotators } from '@/board/annotators/registry';
import { jigsawAnnotator } from '@/board/annotators/jigsaw';
import { buildMarkerGaps } from '@/board/markerGaps';
import { overlapCounts } from '@/board/overlapCounts';
import { resolveLayout } from '@/board/layouts/registry';
import { resolveOverlays } from '@/board/overlays/registry';
import { isJigsawStructure } from '@/variants/jigsaw';

type VariantWithColorNames = {
  colorNames?: string[];
};

interface UseBoardViewOptions {
  variant: Variant;
  baseModel: VariantModel;
  solution: Solution;
  cellSize: number;
  seedBase: number;
}

function shuffledDisplayOrder(symbols: SymbolValue[], seed: number): SymbolValue[] {
  const rng = createSeededRng(seed);
  const order = [...symbols];
  for (let i = order.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }
  return order;
}

export function useBoardView({
  variant,
  baseModel,
  solution,
  cellSize,
  seedBase,
}: UseBoardViewOptions) {
  const { model, structure } = useMemo(
    () => assemblePuzzle(variant, baseModel, solution),
    [baseModel, solution, variant]
  );
  const layoutStrategy = useMemo(() => resolveLayout(variant.layout.kind), [variant.layout.kind]);
  const rects = useMemo(
    () => layoutStrategy.cellRects(variant, cellSize),
    [layoutStrategy, variant, cellSize]
  );
  const size = useMemo(
    () => layoutStrategy.canvasSize(variant, cellSize),
    [layoutStrategy, variant, cellSize]
  );
  const overlapMap = useMemo(
    () => (variant.layout.kind === 'multigrid' ? overlapCounts(variant.layout) : undefined),
    [variant.layout]
  );
  const gutters = useMemo(
    () => variant.deriveGutters?.(structure) ?? layoutStrategy.gutters?.(variant),
    [layoutStrategy, variant, structure]
  );
  const overlays = useMemo(
    () =>
      resolveOverlays(variant.overlayIds ?? []).map((Overlay, index) =>
        createElement(Overlay, {
          key: `${variant.id}-overlay-${index}`,
          rects,
          structure,
        })
      ),
    [variant.id, variant.overlayIds, rects, structure]
  );
  const annotators = useMemo(
    () =>
      variant.id === 'jigsaw' && isJigsawStructure(structure)
        ? [jigsawAnnotator(structure)]
        : resolveAnnotators(variant.annotatorIds ?? []),
    [variant.annotatorIds, structure, variant.id]
  );
  const renderSymbol = useMemo(
    () =>
      variant.renderSymbol
        ? (value: SymbolValue) => variant.renderSymbol!(value, structure)
        : (value: SymbolValue) => String(value),
    [variant, structure]
  );
  const describeSymbol = useMemo(() => {
    const colorNames = (variant as VariantWithColorNames).colorNames;

    if (Array.isArray(colorNames)) {
      return (value: SymbolValue) => colorNames[value - 1] ?? renderSymbol(value);
    }

    return renderSymbol;
  }, [variant, renderSymbol]);
  const markerGaps = useMemo(() => buildMarkerGaps(structure), [structure]);
  const displaySymbols = useMemo(
    () =>
      variant.symbolKind === 'letter'
        ? shuffledDisplayOrder(model.symbols, hashSeed(seedBase, variant.id, 'display-order'))
        : model.symbols,
    [variant.symbolKind, variant.id, model.symbols, seedBase]
  );
  const parityMap = (structure as { parityMap?: Map<CellId, 0 | 1> } | undefined)?.parityMap;

  return {
    model,
    structure,
    rects,
    size,
    overlapMap,
    gutters,
    overlays,
    annotators,
    renderSymbol,
    describeSymbol,
    markerGaps,
    displaySymbols,
    parityMap,
  };
}
