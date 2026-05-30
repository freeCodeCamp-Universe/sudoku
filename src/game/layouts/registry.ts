import type { LayoutStrategy } from '@/game/gameTypes';
import { gridLayout } from './grid';
import { multigridLayout } from './multigrid';
import { triangularLayout } from './triangular';

export const layouts: Record<string, LayoutStrategy> = {
  grid: gridLayout,
  multigrid: multigridLayout,
  triangular: triangularLayout,
};

export function resolveLayout(kind: string): LayoutStrategy {
  const strategy = layouts[kind];

  if (!strategy) {
    throw new Error(`Unknown layout kind: ${kind}`);
  }

  return strategy;
}
