import { resolveConstraints } from './constraints/registry';
import { gridCells, standardHouses } from './grid';
import type { BoardLayout, Cell, House, Variant, VariantModel } from './types';

function buildCells(layout: BoardLayout): Cell[] {
  switch (layout.kind) {
    case 'grid':
      return gridCells(layout.size);
    default:
      throw new Error(`Unsupported layout kind: ${(layout as { kind: string }).kind}`);
  }
}

function defaultHouses(layout: BoardLayout): House[] {
  switch (layout.kind) {
    case 'grid':
      return standardHouses(layout.size, layout.box);
    default:
      throw new Error(`Unsupported layout kind: ${(layout as { kind: string }).kind}`);
  }
}

export function buildModel(variant: Variant): VariantModel {
  const { layout } = variant;
  const cells = buildCells(layout);
  const houses = [
    ...(variant.buildHouses?.(layout) ?? defaultHouses(layout)),
    ...(variant.extraHouses?.(layout) ?? []),
  ];

  return {
    cells,
    houses,
    constraints: resolveConstraints(variant.constraintIds),
    symbols: variant.symbols,
  };
}
