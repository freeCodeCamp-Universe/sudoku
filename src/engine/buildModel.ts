import { resolveConstraints } from './constraints/registry';
import { gridCells, standardHouses } from './grid';
import type { Variant, VariantModel } from './types';

export function buildModel(variant: Variant): VariantModel {
  const { layout } = variant;

  return {
    cells: gridCells(layout.size),
    houses: standardHouses(layout.size, layout.box),
    constraints: resolveConstraints(variant.constraintIds),
    symbols: variant.symbols,
  };
}
